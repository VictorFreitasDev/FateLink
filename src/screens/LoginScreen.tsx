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
import { api } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
}) => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');

    if (!credential.trim()) {
      setErrorMessage('Informe seu usuário, e-mail ou documento (CPF/CNPJ).');
      Alert.alert('Atenção', 'Informe seu usuário, e-mail ou documento (CPF/CNPJ).');
      return;
    }
    if (!password) {
      setErrorMessage('Informe sua senha de acesso.');
      Alert.alert('Atenção', 'Informe sua senha de acesso.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.login(credential.trim(), password);
      setLoading(false);

      if (response.success && response.user) {
        // Redireciona com o papel fixo retornado pelo PostgreSQL
        onLoginSuccess(response.user);
      } else {
        const err = response.error || 'Credenciais inválidas.';
        setErrorMessage(err);
        Alert.alert('Falha no Login', err);
      }
    } catch (e: any) {
      setLoading(false);
      const err = e.message || 'Falha ao conectar com o servidor do banco.';
      setErrorMessage(err);
      Alert.alert('Erro', err);
    }
  };

  // Preenchimento rápido para teste das contas mockadas no PostgreSQL
  const fillMockAccount = (type: 'aluno' | 'empresa' | 'aluno-jales' | 'aluno-victor' | 'empresa-softpar' | 'empresa-totvs' | 'empresa-ibm') => {
    setErrorMessage('');
    if (type === 'aluno' || type === 'aluno-jales') {
      setCredential('gabriel.santos@fatec.sp.gov.br');
      setPassword('123456');
    } else if (type === 'aluno-victor') {
      setCredential('victor.freitas@fatec.sp.gov.br');
      setPassword('fatec123');
    } else if (type === 'empresa' || type === 'empresa-softpar') {
      setCredential('contato@softpar.com.br');
      setPassword('123456');
    } else if (type === 'empresa-totvs') {
      setCredential('rh@totvsriopreto.com.br');
      setPassword('123456');
    } else {
      setCredential('recrutamento@ibm.com.br');
      setPassword('ibm123');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo FateLink */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/fatelink-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Título de Entrada do Figma */}
        <Text style={styles.title}>ENTRE EM SUA CONTA</Text>

        {/* Informação sobre Contas Mockadas no PostgreSQL */}
        <View style={styles.mockNoticeBox}>
          <View style={styles.mockNoticeHeader}>
            <Ionicons name="server" size={14} color={Colors.primary} />
            <Text style={styles.mockNoticeTitle}>Contas do PostgreSQL (Fatec Jales & Região)</Text>
          </View>
          <Text style={styles.mockNoticeDesc}>
            Selecione uma conta para preenchimento rápido (senha: 123456 ou fatec123):
          </Text>
          <View style={styles.mockButtonsRow}>
            <TouchableOpacity
              style={styles.mockPill}
              onPress={() => fillMockAccount('aluno-jales')}
              activeOpacity={0.7}
            >
              <Ionicons name="school" size={12} color={Colors.primaryDark} />
              <Text style={styles.mockPillText}>Aluno Fatec Jales</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mockPill}
              onPress={() => fillMockAccount('empresa-softpar')}
              activeOpacity={0.7}
            >
              <Ionicons name="business" size={12} color={Colors.primaryDark} />
              <Text style={styles.mockPillText}>Softpar (Jales)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mockPill}
              onPress={() => fillMockAccount('empresa-totvs')}
              activeOpacity={0.7}
            >
              <Ionicons name="business" size={12} color={Colors.primaryDark} />
              <Text style={styles.mockPillText}>TOTVS Rio Preto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mockPill}
              onPress={() => fillMockAccount('empresa-ibm')}
              activeOpacity={0.7}
            >
              <Ionicons name="business" size={12} color={Colors.primaryDark} />
              <Text style={styles.mockPillText}>IBM Brasil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mensagem de Erro (se houver) */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.dislike} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Formulário */}
        <View style={styles.form}>
          {/* Input Usuário / E-mail / Documento */}
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={Colors.placeholder} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="USUARIO / EMAIL / CPF / CNPJ"
              placeholderTextColor={Colors.placeholder}
              value={credential}
              onChangeText={(t) => { setCredential(t); setErrorMessage(''); }}
              autoCapitalize="none"
            />
          </View>

          {/* Input Senha */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.placeholder} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="SENHA"
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

          {/* Botão ENTRAR */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          {/* Botão CRIE SUA CONTA */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onNavigateToRegister}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>CRIE SUA CONTA</Text>
          </TouchableOpacity>

          {/* Divisor "OU" */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botões Sociais: GOOGLE e TEAMS */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => fillMockAccount('aluno')}
              activeOpacity={0.85}
            >
              <Image source={require('../../assets/google-logo.png')} style={styles.socialIcon} />
              <Text style={styles.socialText}>GOOGLE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => fillMockAccount('empresa')}
              activeOpacity={0.85}
            >
              <Image source={require('../../assets/teams-logo.png')} style={styles.socialIcon} />
              <Text style={styles.socialText}>TEAMS</Text>
            </TouchableOpacity>
          </View>

          {/* Link Rodapé */}
          <TouchableOpacity style={styles.footerLink} onPress={onNavigateToRegister}>
            <Text style={styles.footerLinkText}>
              Não tem uma conta? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Assinatura Figma */}
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
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  logo: {
    width: 200,
    height: 110,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 14,
    textAlign: 'center',
  },
  mockNoticeBox: {
    width: '100%',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(85, 160, 255, 0.4)',
  },
  mockNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mockNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  mockNoticeDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  mockButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mockPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  mockPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
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
    height: 52,
    marginBottom: 12,
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
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  socialIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  socialText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  footerLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerLinkText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  creditsSection: {
    marginTop: 16,
  },
  creditsText: {
    fontSize: 11,
    color: Colors.placeholder,
    textAlign: 'center',
  },
});
