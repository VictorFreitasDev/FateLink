import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { UserRole } from '../types';
import {
  isValidEmail,
  isValidCPF,
  isValidCNPJ,
  formatCPF,
  formatCNPJ,
} from '../utils/validation';
import { api } from '../services/api';

interface RegisterScreenProps {
  onRegisterSuccess: (user: any) => void;
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
}) => {
  const [role, setRole] = useState<UserRole>('aluno');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Formatação automática do documento
  const handleDocChange = (text: string) => {
    setErrorMessage('');
    if (role === 'aluno') {
      setDocNumber(formatCPF(text));
    } else {
      setDocNumber(formatCNPJ(text));
    }
  };

  // Preenchimento de dados de teste funcionais com 1 clique
  const handleFillTestData = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setErrorMessage('');

    if (role === 'aluno') {
      setUsername(`Aluno Fatec ${randomSuffix}`);
      setEmail(`aluno.${randomSuffix}@fatec.sp.gov.br`);
      // Gera CPF com 11 dígitos
      const randomCpfDigits = `123${randomSuffix}7890`.slice(0, 11);
      setDocNumber(formatCPF(randomCpfDigits));
      setExtraInfo('Análise e Desenvolvimento de Sistemas');
      setPassword('fatec123');
    } else {
      setUsername(`Empresa Tech ${randomSuffix} Ltda`);
      setEmail(`contato.${randomSuffix}@empresa.com.br`);
      // Gera CNPJ com 14 dígitos
      const randomCnpjDigits = `123456780001${randomSuffix}`.slice(0, 14);
      setDocNumber(formatCNPJ(randomCnpjDigits));
      setExtraInfo('Desenvolvimento de Software');
      setPassword('empresa123');
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');

    // 1. Validação de Nome
    if (!username.trim() || username.trim().length < 3) {
      setErrorMessage('O nome deve ter no mínimo 3 caracteres.');
      Alert.alert('Atenção', 'O nome deve ter no mínimo 3 caracteres.');
      return;
    }

    // 2. Validação de E-mail com Regex
    if (!isValidEmail(email)) {
      setErrorMessage('E-mail em formato inválido (ex: nome@dominio.com).');
      Alert.alert('Atenção', 'Informe um e-mail válido (ex: seu.nome@fatec.sp.gov.br ou empresa@dominio.com).');
      return;
    }

    // 3. Validação de CPF ou CNPJ por Regex
    if (role === 'aluno') {
      if (!isValidCPF(docNumber)) {
        setErrorMessage('O CPF deve conter 11 dígitos numéricos.');
        Alert.alert('Atenção', 'O CPF deve conter 11 dígitos numéricos.');
        return;
      }
    } else {
      if (!isValidCNPJ(docNumber)) {
        setErrorMessage('O CNPJ deve conter 14 dígitos numéricos.');
        Alert.alert('Atenção', 'O CNPJ deve conter 14 dígitos numéricos.');
        return;
      }
    }

    // 4. Validação de Senha
    if (!password || password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      Alert.alert('Atenção', 'A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.register({
        tipo: role,
        nome: username.trim(),
        email: email.trim(),
        documento: docNumber.trim(),
        senha: password, // Sem hash conforme solicitado para visualização no pgAdmin 4
        curso_ou_ramo: extraInfo.trim(),
      });

      setLoading(false);

      if (response.success && response.user) {
        // Redireciona diretamente para o app conectado com o novo usuário
        if (Platform.OS === 'web') {
          window.alert(`🎉 Cadastro realizado com sucesso no PostgreSQL (fatelinkBD)!\n\nBem-vindo(a), ${response.user.nome}!`);
          onRegisterSuccess(response.user);
        } else {
          Alert.alert(
            'Cadastro Realizado! 🎉',
            `Sua conta de [${response.user.tipo.toUpperCase()}] foi gravada no PostgreSQL com sucesso!`,
            [
              {
                text: 'Acessar o App',
                onPress: () => onRegisterSuccess(response.user),
              },
            ]
          );
        }
      } else {
        const err = response.error || 'Não foi possível cadastrar.';
        setErrorMessage(err);
        Alert.alert('Erro no Cadastro', err);
      }
    } catch (e: any) {
      setLoading(false);
      const err = e.message || 'Falha ao conectar com o banco de dados.';
      setErrorMessage(err);
      Alert.alert('Erro de Conexão', err);
    }
  };

  // Checagens visuais em tempo real para feedback do usuário
  const isNameValid = username.trim().length >= 3;
  const isEmailValid = isValidEmail(email);
  const isDocValid = role === 'aluno' ? isValidCPF(docNumber) : isValidCNPJ(docNumber);
  const isPasswordValid = password.length >= 6;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Botão Voltar */}
        <TouchableOpacity style={styles.backButton} onPress={onNavigateToLogin}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Logo FateLink */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/fatelink-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>CRIE SUA CONTA NO FATELINK</Text>

        {/* Toggle Aluno vs Empresa (Fixo no banco de dados) */}
        <View style={styles.roleToggleRow}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'aluno' && styles.roleTabActive]}
            onPress={() => {
              setRole('aluno');
              setDocNumber('');
              setErrorMessage('');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="school-outline"
              size={16}
              color={role === 'aluno' ? '#FFFFFF' : Colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.roleTabText, role === 'aluno' && styles.roleTabTextActive]}>
              ALUNO FATEC
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, role === 'empresa' && styles.roleTabActive]}
            onPress={() => {
              setRole('empresa');
              setDocNumber('');
              setErrorMessage('');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="business-outline"
              size={16}
              color={role === 'empresa' ? '#FFFFFF' : Colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.roleTabText, role === 'empresa' && styles.roleTabTextActive]}>
              EMPRESA
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botão de Preenchimento Rápido para Teste */}
        <TouchableOpacity style={styles.testDataButton} onPress={handleFillTestData} activeOpacity={0.8}>
          <Ionicons name="flash-outline" size={14} color={Colors.primaryDark} />
          <Text style={styles.testDataButtonText}>
            Preencher dados de teste para {role === 'aluno' ? 'Aluno' : 'Empresa'}
          </Text>
        </TouchableOpacity>

        {/* Mensagem de Erro (se houver) */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.dislike} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Formulário com Validação Visual */}
        <View style={styles.form}>
          {/* Nome / Usuário */}
          <View style={[styles.inputWrapper, isNameValid && styles.inputWrapperValid]}>
            <Ionicons name="person-outline" size={18} color={Colors.placeholder} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={role === 'aluno' ? 'NOME COMPLETO DO ALUNO' : 'NOME DA EMPRESA / RAZÃO SOCIAL'}
              placeholderTextColor={Colors.placeholder}
              value={username}
              onChangeText={(t) => { setUsername(t); setErrorMessage(''); }}
            />
            {isNameValid && <Ionicons name="checkmark-circle" size={18} color={Colors.like} />}
          </View>

          {/* E-mail com validação Regex */}
          <View style={[styles.inputWrapper, isEmailValid && styles.inputWrapperValid]}>
            <Ionicons name="mail-outline" size={18} color={Colors.placeholder} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={role === 'aluno' ? 'E-MAIL (ex: nome@fatec.sp.gov.br)' : 'E-MAIL CORPORATIVO'}
              placeholderTextColor={Colors.placeholder}
              value={email}
              onChangeText={(t) => { setEmail(t); setErrorMessage(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {isEmailValid && <Ionicons name="checkmark-circle" size={18} color={Colors.like} />}
          </View>

          {/* CPF (Aluno) ou CNPJ (Empresa) com Máscara e Validação de 11/14 dígitos */}
          <View style={[styles.inputWrapper, isDocValid && styles.inputWrapperValid]}>
            <Ionicons name="card-outline" size={18} color={Colors.placeholder} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={role === 'aluno' ? 'CPF (11 dígitos)' : 'CNPJ (14 dígitos)'}
              placeholderTextColor={Colors.placeholder}
              value={docNumber}
              onChangeText={handleDocChange}
              keyboardType="numeric"
              maxLength={role === 'aluno' ? 14 : 18}
            />
            {isDocValid && <Ionicons name="checkmark-circle" size={18} color={Colors.like} />}
          </View>

          {/* Campo adicional: Curso (Aluno) ou Ramo (Empresa) */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name={role === 'aluno' ? 'book-outline' : 'briefcase-outline'}
              size={18}
              color={Colors.placeholder}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={role === 'aluno' ? 'CURSO FATEC (ex: ADS, DSM, GTI)' : 'RAMO DE ATUAÇÃO (ex: Tecnologia)'}
              placeholderTextColor={Colors.placeholder}
              value={extraInfo}
              onChangeText={setExtraInfo}
            />
          </View>

          {/* Senha em texto puro no banco */}
          <View style={[styles.inputWrapper, isPasswordValid && styles.inputWrapperValid]}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.placeholder} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="SENHA (mínimo 6 caracteres)"
              placeholderTextColor={Colors.placeholder}
              value={password}
              onChangeText={(t) => { setPassword(t); setErrorMessage(''); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.placeholder}
              />
            </TouchableOpacity>
          </View>

          {/* Botão CADASTRAR */}
          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>CADASTRAR NO FATELINK</Text>
            )}
          </TouchableOpacity>

          {/* Link para Login */}
          <TouchableOpacity style={styles.loginLink} onPress={onNavigateToLogin}>
            <Text style={styles.loginLinkText}>
              Já tem uma conta? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Faça login</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.creditsSection}>
          <Text style={styles.creditsText}>From Victor, Hugo, Bruno, Kaique e Rafael</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  logo: {
    width: 170,
    height: 85,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 14,
    textAlign: 'center',
  },
  roleToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    borderRadius: 25,
    padding: 4,
    marginBottom: 12,
    width: '100%',
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  roleTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  testDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 14,
    gap: 6,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(85, 160, 255, 0.4)',
  },
  testDataButtonText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    fontSize: 12,
    color: Colors.dislike,
    fontWeight: '600',
    flex: 1,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapperValid: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: '#F8FFF9',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
  },
  eyeButton: {
    padding: 6,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  loginLinkText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  creditsSection: {
    marginTop: 14,
  },
  creditsText: {
    fontSize: 11,
    color: Colors.placeholder,
    textAlign: 'center',
  },
});
