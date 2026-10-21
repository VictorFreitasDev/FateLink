import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { UserRole, Opportunity, Candidate } from '../types';

interface PublishScreenProps {
  role: UserRole;
  currentUser?: {
    id: number;
    tipo: UserRole;
    nome: string;
    email: string;
    documento: string;
    curso_ou_ramo?: string;
    imagemUrl?: string;
  } | null;
  onPublishOpportunity: (opp: Partial<Opportunity>) => Promise<boolean>;
  onPublishCandidate: (cand: Partial<Candidate>) => Promise<boolean>;
  onSuccessNavigate: () => void;
}

const MODALIDADE_OPTIONS: Array<'Híbrido' | 'Remoto' | 'Presencial'> = ['Híbrido', 'Remoto', 'Presencial'];
const TIPO_VAGA_OPTIONS: Array<'Estágio' | 'Trainee' | 'Júnior'> = ['Estágio', 'Trainee', 'Júnior'];
const CURSOS_FATEC = [
  'Análise e Desenv. de Sistemas',
  'Desenv. de Software Multiplataforma',
  'Gestão da TI',
  'Logística',
];
const DISPONIBILIDADE_OPTIONS: Array<'Manhã' | 'Tarde' | 'Noite' | 'Integral'> = ['Manhã', 'Tarde', 'Noite', 'Integral'];

export const PublishScreen: React.FC<PublishScreenProps> = ({
  role,
  currentUser,
  onPublishOpportunity,
  onPublishCandidate,
  onSuccessNavigate,
}) => {
  const isAluno = role === 'aluno';
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados Aluno (Currículo / Perfil Pessoal)
  const [alunoNome, setAlunoNome] = useState(currentUser?.tipo === 'aluno' ? currentUser.nome : '');
  const [alunoTitle, setAlunoTitle] = useState('');
  const [alunoCourse, setAlunoCourse] = useState(
    currentUser?.curso_ou_ramo || 'Análise e Desenv. de Sistemas'
  );
  const [alunoSemestre, setAlunoSemestre] = useState('4º Semestre');
  const [alunoUnidade, setAlunoUnidade] = useState('Fatec Zona Leste');
  const [alunoDisponibilidade, setAlunoDisponibilidade] = useState<'Manhã' | 'Tarde' | 'Noite' | 'Integral'>('Tarde');
  const [alunoSkills, setAlunoSkills] = useState('');
  const [alunoBio, setAlunoBio] = useState('');
  const [alunoGithub, setAlunoGithub] = useState('');
  const [alunoLinkedin, setAlunoLinkedin] = useState('');
  const [alunoPhoto, setAlunoPhoto] = useState(currentUser?.imagemUrl || '');
  const [cvUploaded, setCvUploaded] = useState(false);

  // Estados Empresa (Vaga de Estágio / Oportunidade)
  const [empresaNome, setEmpresaNome] = useState(currentUser?.tipo === 'empresa' ? currentUser.nome : 'Softpar Tecnologia');
  const [empresaTitle, setEmpresaTitle] = useState('');
  const [empresaArea, setEmpresaArea] = useState('Tecnologia da Informação');
  const [empresaLocal, setEmpresaLocal] = useState('Jales - SP (Híbrido)');
  const [empresaModalidade, setEmpresaModalidade] = useState<'Híbrido' | 'Remoto' | 'Presencial'>('Híbrido');
  const [empresaTipo, setEmpresaTipo] = useState<'Estágio' | 'Trainee' | 'Júnior'>('Estágio');
  const [empresaBolsa, setEmpresaBolsa] = useState('R$ 2.100,00 / mês');
  const [empresaReqs, setEmpresaReqs] = useState('');
  const [empresaBeneficios, setEmpresaBeneficios] = useState('Bolsa-auxílio, Vale Refeição, Seguro de Vida, Horário Flexível');
  const [empresaDesc, setEmpresaDesc] = useState('');
  const [empresaPhoto, setEmpresaPhoto] = useState(currentUser?.imagemUrl || '');

  // Preenchimento de Exemplo com 1 Clique (Super prático para testes)
  const handleFillExample = () => {
    if (isAluno) {
      setAlunoNome(currentUser?.nome || 'Gabriel Santos');
      setAlunoTitle('Desenvolvedor Backend & Infraestrutura de TI Jr');
      setAlunoCourse('Gestão da Tecnologia da Informação');
      setAlunoSemestre('5º Semestre');
      setAlunoUnidade('Fatec Jales - Prof. José Camargo');
      setAlunoDisponibilidade('Manhã');
      setAlunoSkills('PostgreSQL, Node.js, Redes, Linux, React Native, Git');
      setAlunoBio(
        'Estudante de GTI na Fatec Jales com paixão por arquitetura de software, servidores Linux e bancos de dados relacionais. Busco oportunidade na região de Jales e Rio Preto.'
      );
      setAlunoGithub('github.com/gabrielsantos-fatec');
      setAlunoLinkedin('linkedin.com/in/gabrielsantos-ti');
      setAlunoPhoto(currentUser?.imagemUrl || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80');
      setCvUploaded(true);
    } else {
      setEmpresaNome(currentUser?.nome || 'Softpar Tecnologia');
      setEmpresaTitle('Estágio em Desenvolvimento de Software & SQL');
      setEmpresaArea('Tecnologia / Automação Comercial');
      setEmpresaLocal('Jales - SP (Híbrido)');
      setEmpresaModalidade('Híbrido');
      setEmpresaTipo('Estágio');
      setEmpresaBolsa('R$ 2.100,00 / mês');
      setEmpresaReqs('Estar cursando FATEC Jales (ADS ou GTI), lógica de programação, vontade de aprender');
      setEmpresaBeneficios('Bolsa-Auxílio de R$ 2.100, Vale Refeição (R$ 650/mês), Vale Transporte, Bônus');
      setEmpresaDesc(
        'Buscamos estudantes talentosos da Fatec Jales para atuar no desenvolvimento de módulos e integrações de microsserviços com PostgreSQL e Node.js em nossa sede regional.'
      );
      setEmpresaPhoto(currentUser?.imagemUrl || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80');
    }
  };

  const handleUploadFile = () => {
    setCvUploaded(!cvUploaded);
    if (!cvUploaded) {
      if (Platform.OS === 'web') {
        window.alert('Documento Curriculo_Fatec_2026.pdf anexado com sucesso!');
      } else {
        Alert.alert('Arquivo Selecionado 📄', 'Curriculo_Fatec_2026.pdf anexado com sucesso para a publicação.');
      }
    }
  };

  const handlePublish = async () => {
    if (isAluno) {
      if (!alunoNome.trim() || !alunoTitle.trim() || !alunoBio.trim()) {
        const msg = 'Por favor, preencha seu nome, título profissional e resumo sobre você.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Campos Obrigatórios', msg);
        return;
      }

      setIsSubmitting(true);
      const newCandidatePayload: Partial<Candidate> = {
        nome: alunoNome.trim(),
        idade: 21,
        curso: alunoCourse,
        semestre: alunoSemestre,
        unidadeFatec: alunoUnidade,
        sobre: alunoBio.trim(),
        competencias: alunoSkills
          ? alunoSkills.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Tecnologia', 'Inovação', 'FATEC'],
        disponibilidade: alunoDisponibilidade,
        imagemUrl: alunoPhoto.trim() || currentUser?.imagemUrl || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
        github: alunoGithub.trim(),
        linkedin: alunoLinkedin.trim(),
        matchScore: 98,
      };

      const success = await onPublishCandidate(newCandidatePayload);
      setIsSubmitting(false);

      if (success) {
        if (Platform.OS === 'web') {
          window.alert('Currículo publicado com sucesso no banco fatelinkBD! Redirecionando para o Feed.');
          onSuccessNavigate();
        } else {
          Alert.alert(
            'Perfil Publicado! 🚀',
            'Seu currículo foi salvo no banco fatelinkBD e está visível para todas as empresas contratantes.',
            [{ text: 'Ver no Feed', onPress: onSuccessNavigate }]
          );
        }
      } else {
        const err = 'Não foi possível salvar no banco de dados. Verifique a conexão com o backend.';
        Platform.OS === 'web' ? window.alert(err) : Alert.alert('Erro', err);
      }
    } else {
      if (!empresaTitle.trim() || !empresaDesc.trim() || !empresaBolsa.trim()) {
        const msg = 'Por favor, preencha o cargo da vaga, o valor da bolsa e a descrição das atividades.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Campos Obrigatórios', msg);
        return;
      }

      setIsSubmitting(true);
      const newOpportunityPayload: Partial<Opportunity> = {
        empresa: empresaNome.trim() || 'Empresa Parceira FATEC',
        nomeFantasia: empresaNome.trim() || 'Tech Partner',
        cargo: empresaTitle.trim(),
        area: empresaArea.trim() || 'Tecnologia da Informação',
        cursoRelacionado: 'Cursos de TI / FATEC',
        localizacao: empresaLocal.trim() || 'São Paulo - SP',
        modalidade: empresaModalidade,
        tipo: empresaTipo,
        bolsa: empresaBolsa.trim(),
        descricao: empresaDesc.trim(),
        requisitos: empresaReqs
          ? empresaReqs.split(',').map((r) => r.trim()).filter(Boolean)
          : ['Estudante FATEC ativo', 'Comprometimento'],
        beneficios: empresaBeneficios
          ? empresaBeneficios.split(',').map((b) => b.trim()).filter(Boolean)
          : ['Bolsa-Auxílio', 'Seguro de Vida'],
        imagemUrl: empresaPhoto.trim() || currentUser?.imagemUrl || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
        matchScore: 96,
      };

      const success = await onPublishOpportunity(newOpportunityPayload);
      setIsSubmitting(false);

      if (success) {
        if (Platform.OS === 'web') {
          window.alert('Vaga cadastrada com sucesso no banco fatelinkBD! Redirecionando para o Feed.');
          onSuccessNavigate();
        } else {
          Alert.alert(
            'Vaga Publicada com Sucesso! 💼',
            'Sua oportunidade foi salva no banco fatelinkBD e já está disponível no feed de todos os alunos.',
            [{ text: 'Ver no Feed', onPress: onSuccessNavigate }]
          );
        }
      } else {
        const err = 'Não foi possível cadastrar a vaga. Verifique a conexão com o backend.';
        Platform.OS === 'web' ? window.alert(err) : Alert.alert('Erro', err);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header da Tela de Publicação */}
        <View style={styles.header}>
          <View style={styles.headerTopBar}>
            <View style={styles.badgeTop}>
              <Text style={styles.badgeTopText}>
                {isAluno ? 'CURRÍCULO & PERFIL DO ALUNO' : 'PUBLICAÇÃO DE VAGA CORPORATIVA'}
              </Text>
            </View>

            {/* Botão de Preenchimento Automático Rápido */}
            <TouchableOpacity
              style={styles.fillExampleBtn}
              onPress={handleFillExample}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={14} color={Colors.primary} />
              <Text style={styles.fillExampleBtnText}>Preencher Exemplo</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>
            {isAluno ? 'Publicar Currículo no Feed' : 'Publicar Vaga para Estudantes'}
          </Text>
          <Text style={styles.subtitle}>
            {isAluno
              ? 'Divulgue suas qualificações e projetos para centenas de empresas contratantes da FATEC.'
              : 'Encontre os melhores estagiários e desenvolvedores qualificados formados pela FATEC.'}
          </Text>
        </View>

        {/* Card de Anexo PDF / Edital do Figma */}
        <TouchableOpacity
          style={[styles.uploadBox, cvUploaded && styles.uploadBoxActive]}
          onPress={handleUploadFile}
          activeOpacity={0.8}
        >
          <View style={[styles.uploadIconCircle, cvUploaded && styles.uploadIconCircleActive]}>
            <Ionicons
              name={cvUploaded ? 'document-text' : 'cloud-upload-outline'}
              size={26}
              color={cvUploaded ? Colors.like : Colors.primary}
            />
          </View>
          <Text style={styles.uploadTitle}>
            {isAluno
              ? cvUploaded
                ? 'Curriculo_Fatec_2026.pdf (Anexado ✓)'
                : 'UPLOAD CURRÍCULO PARA O FEED'
              : cvUploaded
              ? 'Edital_Vaga_Fatec.pdf (Anexado ✓)'
              : 'UPLOAD ARQUIVO DA VAGA / EDITAL'}
          </Text>
          <Text style={styles.uploadSub}>
            {cvUploaded
              ? 'Toque para remover ou alterar o documento'
              : isAluno
              ? 'Toque para simular anexo de PDF ou documento'
              : 'Opcional: documento complementar com descrição detalhada'}
          </Text>
        </TouchableOpacity>

        {/* Formulário Interativo */}
        <View style={styles.formSection}>
          <Text style={styles.sectionHeader}>DADOS DA PUBLICAÇÃO</Text>

          {isAluno ? (
            /* ======================================================== */
            /* FORMULÁRIO DO ALUNO (CURRÍCULO)                          */
            /* ======================================================== */
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Seu Nome Completo *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Victor Freitas"
                  placeholderTextColor={Colors.placeholder}
                  value={alunoNome}
                  onChangeText={setAlunoNome}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Título do Objetivo Profissional *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Desenvolvedor Front-end Júnior / Mobile"
                  placeholderTextColor={Colors.placeholder}
                  value={alunoTitle}
                  onChangeText={setAlunoTitle}
                />
              </View>

              {/* Seletor de Curso FATEC */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Curso FATEC</Text>
                <View style={styles.pillsRow}>
                  {CURSOS_FATEC.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.pillOption, alunoCourse === c && styles.pillOptionActive]}
                      onPress={() => setAlunoCourse(c)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          alunoCourse === c && styles.pillOptionTextActive,
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Semestre</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: 4º Semestre"
                    placeholderTextColor={Colors.placeholder}
                    value={alunoSemestre}
                    onChangeText={setAlunoSemestre}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Unidade Fatec</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: Fatec Zona Leste"
                    placeholderTextColor={Colors.placeholder}
                    value={alunoUnidade}
                    onChangeText={setAlunoUnidade}
                  />
                </View>
              </View>

              {/* Seletor de Disponibilidade */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Disponibilidade de Horário</Text>
                <View style={styles.pillsRow}>
                  {DISPONIBILIDADE_OPTIONS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.pillOption,
                        alunoDisponibilidade === d && styles.pillOptionActive,
                      ]}
                      onPress={() => setAlunoDisponibilidade(d)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          alunoDisponibilidade === d && styles.pillOptionTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Competências & Tecnologias (separadas por vírgula)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: React Native, TypeScript, Node.js, PostgreSQL"
                  placeholderTextColor={Colors.placeholder}
                  value={alunoSkills}
                  onChangeText={setAlunoSkills}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>GitHub (opcional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="github.com/seuperfil"
                    placeholderTextColor={Colors.placeholder}
                    value={alunoGithub}
                    onChangeText={setAlunoGithub}
                    autoCapitalize="none"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>LinkedIn (opcional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="linkedin.com/in/..."
                    placeholderTextColor={Colors.placeholder}
                    value={alunoLinkedin}
                    onChangeText={setAlunoLinkedin}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Resumo Profissional / Sobre Você *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Escreva sobre suas experiências, projetos da FATEC e o que você busca na sua carreira..."
                  placeholderTextColor={Colors.placeholder}
                  value={alunoBio}
                  onChangeText={setAlunoBio}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </>
          ) : (
            /* ======================================================== */
            /* FORMULÁRIO DA EMPRESA (VAGA DE ESTÁGIO)                 */
            /* ======================================================== */
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome Fantasia da Empresa *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Tech Partners FATEC"
                  placeholderTextColor={Colors.placeholder}
                  value={empresaNome}
                  onChangeText={setEmpresaNome}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Título da Vaga / Cargo *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Desenvolvedor(a) Front-end Júnior / Estágio"
                  placeholderTextColor={Colors.placeholder}
                  value={empresaTitle}
                  onChangeText={setEmpresaTitle}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Área de Atuação</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: Tecnologia / TI"
                    placeholderTextColor={Colors.placeholder}
                    value={empresaArea}
                    onChangeText={setEmpresaArea}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Bolsa-Auxílio / Salário *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: R$ 2.400,00 / mês"
                    placeholderTextColor={Colors.placeholder}
                    value={empresaBolsa}
                    onChangeText={setEmpresaBolsa}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Localização</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: São Paulo - SP (Zona Leste / Metrô)"
                  placeholderTextColor={Colors.placeholder}
                  value={empresaLocal}
                  onChangeText={setEmpresaLocal}
                />
              </View>

              {/* Seletor de Modalidade */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Modalidade de Trabalho</Text>
                <View style={styles.pillsRow}>
                  {MODALIDADE_OPTIONS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pillOption, empresaModalidade === m && styles.pillOptionActive]}
                      onPress={() => setEmpresaModalidade(m)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          empresaModalidade === m && styles.pillOptionTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Seletor de Tipo */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tipo de Contrato</Text>
                <View style={styles.pillsRow}>
                  {TIPO_VAGA_OPTIONS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.pillOption, empresaTipo === t && styles.pillOptionActive]}
                      onPress={() => setEmpresaTipo(t)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          empresaTipo === t && styles.pillOptionTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Requisitos (separados por vírgula)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Estudante FATEC ativo, React Native, TypeScript"
                  placeholderTextColor={Colors.placeholder}
                  value={empresaReqs}
                  onChangeText={setEmpresaReqs}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Benefícios Oferecidos</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Bolsa-Auxílio, Vale Refeição, Seguro de Vida"
                  placeholderTextColor={Colors.placeholder}
                  value={empresaBeneficios}
                  onChangeText={setEmpresaBeneficios}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descrição da Vaga e Atividades *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Descreva as responsabilidades, dia a dia e o que a empresa oferece..."
                  placeholderTextColor={Colors.placeholder}
                  value={empresaDesc}
                  onChangeText={setEmpresaDesc}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </>
          )}

          {/* Botão de Publicação */}
          <TouchableOpacity
            style={[styles.publishBtn, isSubmitting && styles.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.publishBtnText}>
                  {isAluno ? 'PUBLICAR CURRÍCULO NO FEED' : 'PUBLICAR VAGA NO FEED'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeTop: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTopText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  fillExampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  fillExampleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  uploadBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadBoxActive: {
    borderColor: Colors.like,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderStyle: 'solid',
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadIconCircleActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  uploadSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pillOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 24,
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  publishBtnDisabled: {
    opacity: 0.65,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
