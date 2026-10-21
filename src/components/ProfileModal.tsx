import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { UserRole, Candidate, CandidateProject, CandidateExperience } from '../types';
import { api } from '../services/api';
import * as DocumentPicker from 'expo-document-picker';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    id: number;
    tipo: UserRole;
    nome: string;
    email: string;
    documento: string;
    curso_ou_ramo?: string;
    imagemUrl?: string;
  } | null;
  onProfileUpdated: (data: { imagemUrl?: string; nome?: string; curso_ou_ramo?: string } | string) => void;
  onLogout: () => void;
}

const CURSOS_FATEC_JALES = [
  'Análise e Desenvolvimento de Sistemas',
  'Agronegócio',
  'Gestão Empresarial (Presencial)',
  'Gestão Empresarial (EaD)',
  'Sistemas para Internet',
];

const SEMESTRES_FATEC_JALES = [
  '1º Semestre',
  '2º Semestre',
  '3º Semestre',
  '4º Semestre',
  '5º Semestre',
  '6º Semestre',
];

const CIDADES_REGIAO_FATEC = [
  'Jales - SP',
  'Fernandópolis - SP',
  'Santa Fé do Sul - SP',
  'Votuporanga - SP',
  'Urânia - SP',
  'Palmeira d\'Oeste - SP',
  'São José do Rio Preto - SP',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  user,
  onProfileUpdated,
  onLogout,
}) => {
  if (!user) return null;

  const isAluno = user.tipo === 'aluno';

  // Aba ativa: 'geral' | 'editar' | 'curriculo' | 'projetos' | 'experiencias'
  const [activeTab, setActiveTab] = useState<'geral' | 'editar' | 'curriculo' | 'projetos' | 'experiencias'>('geral');

  // Estado dos dados do candidato no PostgreSQL
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados dos formulários de edição
  const [nome, setNome] = useState(user.nome || '');
  const [idade, setIdade] = useState('21');
  const [curso, setCurso] = useState(user.curso_ou_ramo || 'Análise e Desenvolvimento de Sistemas');
  const [unidadeFatec, setUnidadeFatec] = useState('Fatec Jales');
  const [semestre, setSemestre] = useState('4º Semestre');
  const [previsaoFormacao, setPrevisaoFormacao] = useState('Dezembro / 2026');
  const [localizacao, setLocalizacao] = useState('Jales - SP');
  const [disponibilidade, setDisponibilidade] = useState<'Manhã' | 'Tarde' | 'Noite' | 'Integral'>('Tarde');
  const [modalidadeDesejada, setModalidadeDesejada] = useState<'Remoto' | 'Híbrido' | 'Presencial' | 'Qualquer'>('Híbrido');
  const [sobre, setSobre] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [imageUrl, setImageUrl] = useState(user.imagemUrl || '');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);

  // Competências
  const [competencias, setCompetencias] = useState<string[]>([]);
  const [newSkillText, setNewSkillText] = useState('');

  // Projetos
  const [projetos, setProjetos] = useState<CandidateProject[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTechs, setNewProjectTechs] = useState('');
  const [newProjectImage, setNewProjectImage] = useState('');
  const [newProjectGithub, setNewProjectGithub] = useState('');
  const [newProjectDemo, setNewProjectDemo] = useState('');

  // Experiências e Certificações
  const [experiencias, setExperiencias] = useState<CandidateExperience[]>([]);
  const [certificacoes, setCertificacoes] = useState<string[]>([]);
  const [newCertText, setNewCertText] = useState('');
  const [isAddingExp, setIsAddingExp] = useState(false);
  const [newExpCargo, setNewExpCargo] = useState('');
  const [newExpEmpresa, setNewExpEmpresa] = useState('');
  const [newExpPeriodo, setNewExpPeriodo] = useState('');
  const [newExpDesc, setNewExpDesc] = useState('');

  // Currículo em PDF
  const [curriculoUrl, setCurriculoUrl] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Carregar dados reais do candidato do banco ao abrir modal
  const loadCandidateData = async () => {
    if (!isAluno) return;
    setLoadingProfile(true);
    try {
      const data = await api.getCandidateProfile(user.id);
      if (data) {
        setCandidate(data);
        setNome(data.nome || user.nome);
        setIdade(String(data.idade || 21));
        setCurso(data.curso || user.curso_ou_ramo || 'Análise e Desenvolvimento de Sistemas');
        setUnidadeFatec(data.unidadeFatec || 'Fatec Jales');
        setSemestre(data.semestre || '4º Semestre');
        setPrevisaoFormacao(data.previsaoFormacao || 'Dezembro / 2026');
        setLocalizacao(data.localizacao || 'Jales - SP');
        setDisponibilidade((data.disponibilidade as any) || 'Tarde');
        setModalidadeDesejada((data.modalidadeDesejada as any) || 'Híbrido');
        setSobre(data.sobre || '');
        setGithub(data.github || '');
        setLinkedin(data.linkedin || '');
        setPortfolio(data.portfolio || '');
        setImageUrl(data.imagemUrl || user.imagemUrl || '');
        setCompetencias(data.competencias || []);
        setProjetos(data.projetos || []);
        setExperiencias(data.experiencias || []);
        setCertificacoes(data.certificacoes || []);
        setCurriculoUrl(data.curriculoUrl || null);
      }
    } catch (e) {
      console.warn('Erro ao carregar perfil do candidato:', e);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (visible && user) {
      loadCandidateData();
    }
  }, [visible, user?.id]);

  // Cálculo de Porcentagem de Preenchimento Real do Perfil
  const calculateProgress = () => {
    let score = 0;
    const missing: { label: string; action: () => void }[] = [];

    // Nome e Sobre (15 pts)
    if (nome && sobre && sobre.trim().length >= 15) {
      score += 15;
    } else {
      missing.push({ label: 'Preencher resumo profissional (Sobre)', action: () => setActiveTab('editar') });
    }

    // Foto (5 pts)
    if (imageUrl && !imageUrl.includes('default')) {
      score += 5;
    } else {
      missing.push({ label: 'Adicionar foto de perfil', action: () => setIsEditingPhoto(true) });
    }

    // Formação e Localização (15 pts)
    if (curso && semestre && previsaoFormacao && localizacao) {
      score += 15;
    } else {
      missing.push({ label: 'Completar dados de formatura e localização', action: () => setActiveTab('editar') });
    }

    // Competências (15 pts)
    if (competencias.length >= 3) {
      score += 15;
    } else {
      missing.push({ label: 'Cadastrar pelo menos 3 competências técnicas', action: () => setActiveTab('experiencias') });
    }

    // Currículo em PDF (20 pts)
    if (curriculoUrl) {
      score += 20;
    } else {
      missing.push({ label: 'Fazer upload do currículo em PDF', action: () => setActiveTab('curriculo') });
    }

    // Projetos (15 pts)
    if (projetos.length >= 1) {
      score += 15;
    } else {
      missing.push({ label: 'Cadastrar pelo menos 1 projeto prático', action: () => setActiveTab('projetos') });
    }

    // Links profissionais (10 pts)
    if (github || linkedin || portfolio) {
      score += 10;
    } else {
      missing.push({ label: 'Adicionar GitHub, LinkedIn ou Portfólio', action: () => setActiveTab('editar') });
    }

    // Experiências ou certificações (5 pts)
    if (experiencias.length > 0 || certificacoes.length > 0) {
      score += 5;
    } else {
      missing.push({ label: 'Adicionar experiências ou certificações', action: () => setActiveTab('experiencias') });
    }

    return {
      percentage: Math.min(100, score),
      missing,
    };
  };

  const progress = calculateProgress();

  // Salvar Alterações de Dados do Perfil no Backend
  const handleSaveProfile = async () => {
    if (!nome.trim()) {
      showToast('O nome não pode ficar vazio.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Candidate> = {
        nome: nome.trim(),
        idade: parseInt(idade, 10) || 21,
        curso: curso.trim(),
        unidadeFatec: unidadeFatec.trim(),
        semestre: semestre.trim(),
        previsaoFormacao: previsaoFormacao.trim(),
        localizacao: localizacao.trim(),
        disponibilidade,
        modalidadeDesejada,
        sobre: sobre.trim(),
        github: github.trim(),
        linkedin: linkedin.trim(),
        portfolio: portfolio.trim(),
        imagemUrl: imageUrl.trim() || user.imagemUrl,
        competencias,
        projetos,
        experiencias,
        certificacoes,
      };

      const updated = await api.updateCandidateProfile(user.id, payload);
      if (updated) {
        setCandidate(updated);
        onProfileUpdated({
          imagemUrl: updated.imagemUrl,
          nome: updated.nome,
          curso_ou_ramo: updated.curso,
        });
        showToast('Perfil atualizado com sucesso no banco de dados!');
        setActiveTab('geral');
      } else {
        showToast('Não foi possível salvar o perfil. Tente novamente.');
      }
    } catch (e: any) {
      showToast(e.message || 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  // Upload Real de Currículo em PDF
  const handlePickAndUploadResume = async () => {
    try {
      let fileData: { fileName: string; fileBase64: string } | null = null;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        fileData = await new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'application/pdf';
          input.onchange = (e: any) => {
            const file = e.target?.files?.[0];
            if (!file) {
              resolve(null);
              return;
            }
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
              alert('Apenas arquivos PDF são aceitos.');
              resolve(null);
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                fileName: file.name,
                fileBase64: reader.result as string,
              });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          };
          input.click();
        });
      } else {
        const res = await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
        });

        if (!res.canceled && res.assets && res.assets.length > 0) {
          const asset = res.assets[0];
          // Se for web no picker:
          if (asset.file) {
            fileData = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve({ fileName: asset.name, fileBase64: reader.result as string });
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(asset.file as any);
            });
          } else {
            // Em nativo, envia a referência do arquivo
            fileData = {
              fileName: asset.name,
              fileBase64: asset.uri,
            };
          }
        }
      }

      if (!fileData || !fileData.fileBase64) return;

      setUploadingPdf(true);
      const res = await api.uploadResume(user.id, fileData.fileName, fileData.fileBase64);
      if (res.success && res.curriculoUrl) {
        setCurriculoUrl(res.curriculoUrl);
        showToast('Currículo em PDF enviado com sucesso!');
        loadCandidateData();
      } else {
        showToast(res.error || 'Erro ao enviar currículo.');
      }
    } catch (e: any) {
      showToast(e.message || 'Erro inesperado ao selecionar arquivo.');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Remover Currículo em PDF
  const handleDeleteResume = async () => {
    const doDelete = async () => {
      setUploadingPdf(true);
      try {
        const res = await api.deleteResume(user.id);
        if (res.success) {
          setCurriculoUrl(null);
          showToast('Currículo removido com sucesso.');
          loadCandidateData();
        } else {
          showToast(res.error || 'Erro ao remover currículo.');
        }
      } catch (e: any) {
        showToast(e.message || 'Erro ao excluir currículo.');
      } finally {
        setUploadingPdf(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Deseja realmente remover o seu currículo em PDF?')) {
        doDelete();
      }
      return;
    }

    Alert.alert('Remover Currículo', 'Deseja realmente excluir seu arquivo de currículo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: doDelete },
    ]);
  };

  // Abrir / Baixar PDF
  const handleOpenResume = () => {
    if (!curriculoUrl) return;
    const fullUrl = api.getResumeUrl(curriculoUrl);
    if (!fullUrl) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(fullUrl, '_blank');
    } else {
      Linking.openURL(fullUrl).catch((err) => console.warn('Erro ao abrir link do PDF:', err));
    }
  };

  // Adicionar Novo Projeto
  const handleAddProject = () => {
    if (!newProjectName.trim()) {
      showToast('O título do projeto é obrigatório.');
      return;
    }

    const techArray = newProjectTechs
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const project: CandidateProject = {
      id: `proj-${Date.now()}`,
      titulo: newProjectName.trim(),
      descricao: newProjectDesc.trim() || 'Projeto prático desenvolvido.',
      tecnologias: techArray.length > 0 ? techArray : ['React Native', 'TypeScript'],
      imagemUrl: newProjectImage.trim() || undefined,
      githubUrl: newProjectGithub.trim() || undefined,
      demoUrl: newProjectDemo.trim() || undefined,
    };

    const nextProjects = [project, ...projetos];
    setProjetos(nextProjects);
    setIsAddingProject(false);
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectTechs('');
    setNewProjectImage('');
    setNewProjectGithub('');
    setNewProjectDemo('');
    showToast('Projeto adicionado à lista! Clique em "Salvar Alterações" para persistir.');
  };

  // Remover Projeto
  const handleRemoveProject = (index: number) => {
    setProjetos(projetos.filter((_, i) => i !== index));
  };

  // Adicionar Competência
  const handleAddCompetencia = () => {
    const skill = newSkillText.trim();
    if (!skill) return;
    if (!competencias.some((c) => c.toLowerCase() === skill.toLowerCase())) {
      setCompetencias([...competencias, skill]);
    }
    setNewSkillText('');
  };

  // Remover Competência
  const handleRemoveCompetencia = (skill: string) => {
    setCompetencias(competencias.filter((c) => c !== skill));
  };

  // Adicionar Certificação
  const handleAddCertificacao = () => {
    const cert = newCertText.trim();
    if (!cert) return;
    setCertificacoes([...certificacoes, cert]);
    setNewCertText('');
  };

  // Remover Certificação
  const handleRemoveCertificacao = (cert: string) => {
    setCertificacoes(certificacoes.filter((c) => c !== cert));
  };

  // Adicionar Experiência
  const handleAddExperiencia = () => {
    if (!newExpCargo.trim() || !newExpEmpresa.trim()) {
      showToast('Cargo e Empresa são obrigatórios.');
      return;
    }
    const exp: CandidateExperience = {
      id: `exp-${Date.now()}`,
      cargo: newExpCargo.trim(),
      empresa: newExpEmpresa.trim(),
      periodo: newExpPeriodo.trim() || '2024 - Atual',
      descricao: newExpDesc.trim(),
    };
    setExperiencias([exp, ...experiencias]);
    setIsAddingExp(false);
    setNewExpCargo('');
    setNewExpEmpresa('');
    setNewExpPeriodo('');
    setNewExpDesc('');
  };

  // Salvar Foto Rápida
  const handleSavePhotoOnly = async () => {
    if (!imageUrl.trim()) {
      showToast('Informe uma URL de imagem válida.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.updateProfileImage(user.id, imageUrl.trim());
      if (res.success) {
        onProfileUpdated(imageUrl.trim());
        setIsEditingPhoto(false);
        showToast('Foto atualizada com sucesso!');
      } else {
        showToast(res.error || 'Erro ao atualizar foto.');
      }
    } catch (e: any) {
      showToast(e.message || 'Erro ao atualizar foto.');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('FateLink', msg);
    }
  };

  const currentAvatar = imageUrl.trim() || user.imagemUrl || (user.tipo === 'aluno'
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header do Modal com Fechar e Logout */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="person-circle-outline" size={24} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Meu Perfil Profissional</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Banner de Identificação & Foto */}
          <View style={styles.profileBanner}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: currentAvatar }} style={styles.avatarImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.editAvatarBadge}
                onPress={() => setIsEditingPhoto(!isEditingPhoto)}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.bannerInfo}>
              <Text style={styles.userName} numberOfLines={1}>{nome || user.nome}</Text>
              <Text style={styles.userRoleText}>{curso} • {unidadeFatec}</Text>
              <View style={styles.roleTag}>
                <Ionicons name={isAluno ? 'school' : 'business'} size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.roleTagText}>{isAluno ? 'ALUNO FATEC' : 'EMPRESA CONTRATANTE'}</Text>
              </View>
            </View>
          </View>

          {/* Editor rápido de foto */}
          {isEditingPhoto && (
            <View style={styles.editPhotoBox}>
              <Text style={styles.editPhotoLabel}>Alterar URL da Foto de Perfil:</Text>
              <TextInput
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://exemplo.com/minha-foto.jpg"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <TouchableOpacity onPress={() => setIsEditingPhoto(false)} style={styles.photoCancelBtn}>
                  <Text style={styles.photoCancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSavePhotoOnly} style={styles.photoSaveBtn} disabled={saving}>
                  <Text style={styles.photoSaveBtnText}>{saving ? 'Salvando...' : 'Salvar Foto'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Barra de Progresso do Perfil (Exclusivo Aluno) */}
          {isAluno && (
            <View style={styles.progressCard}>
              <View style={styles.progressHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="sparkles" size={15} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.progressTitle}>Preenchimento do Perfil</Text>
                </View>
                <Text style={styles.progressPercentText}>{progress.percentage}% Completo</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress.percentage}%`,
                      backgroundColor: progress.percentage >= 80 ? '#10B981' : progress.percentage >= 50 ? '#0EA5E9' : '#F59E0B',
                    },
                  ]}
                />
              </View>

              {progress.missing.length > 0 ? (
                <View style={styles.missingTipBox}>
                  <Text style={styles.missingTipText}>
                    💡 Próxima etapa: <Text style={{ fontWeight: '800' }}>{progress.missing[0].label}</Text>
                  </Text>
                </View>
              ) : (
                <View style={styles.missingTipBoxSuccess}>
                  <Text style={styles.missingTipSuccessText}>🎉 Perfil completo! 100% pronto para atrair recrutadores.</Text>
                </View>
              )}
            </View>
          )}

          {/* Abas de Navegação */}
          {isAluno && (
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'geral' && styles.tabButtonActive]}
                onPress={() => setActiveTab('geral')}
              >
                <Ionicons name="reader-outline" size={13} color={activeTab === 'geral' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.tabButtonText, activeTab === 'geral' && styles.tabButtonTextActive]}>Visão Geral</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'editar' && styles.tabButtonActive]}
                onPress={() => setActiveTab('editar')}
              >
                <Ionicons name="create-outline" size={13} color={activeTab === 'editar' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.tabButtonText, activeTab === 'editar' && styles.tabButtonTextActive]}>Dados</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'curriculo' && styles.tabButtonActive]}
                onPress={() => setActiveTab('curriculo')}
              >
                <Ionicons name="document-text-outline" size={13} color={activeTab === 'curriculo' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.tabButtonText, activeTab === 'curriculo' && styles.tabButtonTextActive]}>Currículo PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'projetos' && styles.tabButtonActive]}
                onPress={() => setActiveTab('projetos')}
              >
                <Ionicons name="rocket-outline" size={13} color={activeTab === 'projetos' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.tabButtonText, activeTab === 'projetos' && styles.tabButtonTextActive]}>Projetos ({projetos.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'experiencias' && styles.tabButtonActive]}
                onPress={() => setActiveTab('experiencias')}
              >
                <Ionicons name="ribbon-outline" size={13} color={activeTab === 'experiencias' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.tabButtonText, activeTab === 'experiencias' && styles.tabButtonTextActive]}>Skills</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Conteúdo Dinâmico por Aba */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {loadingProfile ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13 }}>Carregando dados profissionais...</Text>
              </View>
            ) : (
              <>
                {/* 1. ABA: VISÃO GERAL */}
                {activeTab === 'geral' && (
                  <View style={styles.sectionWrap}>
                    {/* Apresentação */}
                    <View style={styles.cardBox}>
                      <Text style={styles.cardBoxTitle}>Resumo Profissional</Text>
                      <Text style={styles.cardBoxDesc}>{sobre || 'Nenhum resumo profissional informado. Clique na aba "Dados" para escrever sobre você.'}</Text>
                    </View>

                    {/* Métricas de Formação */}
                    <View style={styles.metricsGrid}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricItemLabel}>Semestre</Text>
                        <Text style={styles.metricItemVal}>{semestre}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricItemLabel}>Formatura</Text>
                        <Text style={styles.metricItemVal}>{previsaoFormacao}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricItemLabel}>Turno</Text>
                        <Text style={styles.metricItemVal}>{disponibilidade}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricItemLabel}>Modalidade</Text>
                        <Text style={styles.metricItemVal}>{modalidadeDesejada}</Text>
                      </View>
                    </View>

                    {/* Status do Currículo PDF */}
                    <View style={styles.cardBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="document-attach" size={18} color={curriculoUrl ? '#10B981' : '#F59E0B'} style={{ marginRight: 6 }} />
                          <Text style={styles.cardBoxTitle}>Currículo em PDF</Text>
                        </View>
                        {curriculoUrl && (
                          <TouchableOpacity onPress={handleOpenResume} style={styles.quickOpenBtn}>
                            <Text style={styles.quickOpenBtnText}>Abrir PDF</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.cardBoxDesc}>
                        {curriculoUrl
                          ? '✅ Currículo em PDF carregado e disponível para recrutadores.'
                          : '⚠️ Nenhum currículo em PDF enviado. Envie na aba "Currículo PDF" para destacar seu perfil.'}
                      </Text>
                    </View>

                    {/* Links Sociais */}
                    <View style={styles.cardBox}>
                      <Text style={styles.cardBoxTitle}>Links Profissionais</Text>
                      <View style={{ gap: 6, marginTop: 4 }}>
                        <Text style={styles.linkLine}>🐙 GitHub: <Text style={styles.linkLineVal}>{github || 'Não informado'}</Text></Text>
                        <Text style={styles.linkLine}>💼 LinkedIn: <Text style={styles.linkLineVal}>{linkedin || 'Não informado'}</Text></Text>
                        <Text style={styles.linkLine}>🌐 Portfólio: <Text style={styles.linkLineVal}>{portfolio || 'Não informado'}</Text></Text>
                      </View>
                    </View>

                    {/* Checklist de Itens Pendentes */}
                    {progress.missing.length > 0 && (
                      <View style={styles.checklistCard}>
                        <Text style={styles.checklistTitle}>Checklist para 100% de Preenchimento</Text>
                        {progress.missing.map((item, idx) => (
                          <TouchableOpacity key={idx} style={styles.checklistItemRow} onPress={item.action}>
                            <Ionicons name="ellipse-outline" size={14} color="#EF4444" style={{ marginRight: 8, marginTop: 1 }} />
                            <Text style={styles.checklistItemText}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* 2. ABA: EDITAR DADOS */}
                {activeTab === 'editar' && (
                  <View style={styles.sectionWrap}>
                    <Text style={styles.formSectionTitle}>Informações Pessoais & FATEC</Text>

                    <Text style={styles.label}>Nome Completo:</Text>
                    <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Idade:</Text>
                        <TextInput style={styles.input} value={idade} onChangeText={setIdade} keyboardType="numeric" placeholder="21" />
                      </View>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.label}>Semestre Atual:</Text>
                        <TextInput style={styles.input} value={semestre} onChangeText={setSemestre} placeholder="4º Semestre" />
                      </View>
                    </View>

                    {/* Pills de Semestre FATEC */}
                    <View style={[styles.radioRow, { marginBottom: 12 }]}>
                      {SEMESTRES_FATEC_JALES.map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.miniChip, semestre === s && styles.miniChipActive]}
                          onPress={() => setSemestre(s)}
                        >
                          <Text style={[styles.miniChipText, semestre === s && styles.miniChipTextActive]}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.label}>Curso FATEC Jales:</Text>
                    <TextInput style={styles.input} value={curso} onChangeText={setCurso} placeholder="Nome do seu curso" />

                    {/* Pills dos 5 Cursos Oficiais */}
                    <View style={[styles.radioRow, { flexWrap: 'wrap', marginBottom: 12 }]}>
                      {CURSOS_FATEC_JALES.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.miniChip, curso === c && styles.miniChipActive]}
                          onPress={() => setCurso(c)}
                        >
                          <Text style={[styles.miniChipText, curso === c && styles.miniChipTextActive]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.label}>Faculdade / Unidade FATEC:</Text>
                    <TextInput style={styles.input} value={unidadeFatec} onChangeText={setUnidadeFatec} placeholder="Ex: Fatec Jales" />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Previsão de Formatura:</Text>
                        <TextInput style={styles.input} value={previsaoFormacao} onChangeText={setPrevisaoFormacao} placeholder="Dezembro / 2026" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Cidade / Localização:</Text>
                        <TextInput style={styles.input} value={localizacao} onChangeText={setLocalizacao} placeholder="Jales - SP" />
                      </View>
                    </View>

                    {/* Pills das Cidades da Região */}
                    <View style={[styles.radioRow, { flexWrap: 'wrap', marginBottom: 12 }]}>
                      {CIDADES_REGIAO_FATEC.map((city) => (
                        <TouchableOpacity
                          key={city}
                          style={[styles.miniChip, localizacao === city && styles.miniChipActive]}
                          onPress={() => setLocalizacao(city)}
                        >
                          <Text style={[styles.miniChipText, localizacao === city && styles.miniChipTextActive]}>{city.replace(' - SP', '')}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Disponibilidade de Turno:</Text>
                        <View style={styles.radioRow}>
                          {(['Manhã', 'Tarde', 'Noite', 'Integral'] as const).map((turn) => (
                            <TouchableOpacity
                              key={turn}
                              style={[styles.miniChip, disponibilidade === turn && styles.miniChipActive]}
                              onPress={() => setDisponibilidade(turn)}
                            >
                              <Text style={[styles.miniChipText, disponibilidade === turn && styles.miniChipTextActive]}>{turn}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>

                    <Text style={styles.label}>Modalidade Desejada:</Text>
                    <View style={styles.radioRow}>
                      {(['Remoto', 'Híbrido', 'Presencial', 'Qualquer'] as const).map((mod) => (
                        <TouchableOpacity
                          key={mod}
                          style={[styles.miniChip, modalidadeDesejada === mod && styles.miniChipActive]}
                          onPress={() => setModalidadeDesejada(mod)}
                        >
                          <Text style={[styles.miniChipText, modalidadeDesejada === mod && styles.miniChipTextActive]}>{mod}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.label}>Resumo Profissional / Apresentação:</Text>
                    <TextInput
                      style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                      value={sobre}
                      onChangeText={setSobre}
                      multiline
                      numberOfLines={4}
                      placeholder="Fale sobre seus objetivos profissionais, paixão pela tecnologia e diferenciais..."
                    />

                    <Text style={styles.formSectionTitle}>Links & Portfólio</Text>
                    <Text style={styles.label}>Link do GitHub:</Text>
                    <TextInput style={styles.input} value={github} onChangeText={setGithub} placeholder="https://github.com/usuario" autoCapitalize="none" />

                    <Text style={styles.label}>Link do LinkedIn:</Text>
                    <TextInput style={styles.input} value={linkedin} onChangeText={setLinkedin} placeholder="https://linkedin.com/in/usuario" autoCapitalize="none" />

                    <Text style={styles.label}>Link do Portfólio / Site Pessoal:</Text>
                    <TextInput style={styles.input} value={portfolio} onChangeText={setPortfolio} placeholder="https://meusite.dev" autoCapitalize="none" />

                    <TouchableOpacity style={styles.saveMainBtn} onPress={handleSaveProfile} disabled={saving}>
                      <Ionicons name="save-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.saveMainBtnText}>{saving ? 'Salvando no Banco...' : 'Salvar Alterações no Banco'}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 3. ABA: CURRÍCULO EM PDF */}
                {activeTab === 'curriculo' && (
                  <View style={styles.sectionWrap}>
                    <Text style={styles.formSectionTitle}>Gerenciamento de Currículo em PDF</Text>
                    <Text style={styles.subHint}>
                      Envie seu currículo formatado em PDF para que empresas possam baixá-lo e avaliá-lo diretamente no processo seletivo.
                    </Text>

                    {curriculoUrl ? (
                      <View style={styles.resumeActiveCard}>
                        <View style={styles.pdfIconBadge}>
                          <Ionicons name="document-text" size={28} color="#EF4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.resumeActiveTitle}>Currículo em PDF Ativo</Text>
                          <Text style={styles.resumeActiveSub}>Arquivo armazenado com sucesso no servidor.</Text>
                          <Text style={styles.resumeActiveUrl} numberOfLines={1}>{curriculoUrl}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.resumeEmptyBox}>
                        <Ionicons name="cloud-upload-outline" size={44} color="#94A3B8" />
                        <Text style={styles.resumeEmptyTitle}>Nenhum currículo em PDF enviado</Text>
                        <Text style={styles.resumeEmptyDesc}>
                          Selecione um arquivo PDF do seu dispositivo para vincular permanentemente ao seu perfil.
                        </Text>
                      </View>
                    )}

                    {/* Botões de Ação do PDF */}
                    <View style={{ gap: 10, marginTop: 14 }}>
                      {curriculoUrl && (
                        <TouchableOpacity style={styles.viewPdfBtn} onPress={handleOpenResume}>
                          <Ionicons name="eye-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.viewPdfBtnText}>Visualizar / Baixar Currículo</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.uploadPdfBtn}
                        onPress={handlePickAndUploadResume}
                        disabled={uploadingPdf}
                      >
                        <Ionicons name="cloud-upload" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.uploadPdfBtnText}>
                          {uploadingPdf
                            ? 'Enviando arquivo...'
                            : curriculoUrl
                            ? 'Substituir Currículo por Novo PDF'
                            : 'Selecionar e Enviar Arquivo PDF'}
                        </Text>
                      </TouchableOpacity>

                      {curriculoUrl && (
                        <TouchableOpacity
                          style={styles.deletePdfBtn}
                          onPress={handleDeleteResume}
                          disabled={uploadingPdf}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                          <Text style={styles.deletePdfBtnText}>Remover Currículo do Perfil</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* 4. ABA: PROJETOS */}
                {activeTab === 'projetos' && (
                  <View style={styles.sectionWrap}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.formSectionTitle}>Projetos & Portfólio ({projetos.length})</Text>
                      <TouchableOpacity
                        style={styles.addSmallBtn}
                        onPress={() => setIsAddingProject(!isAddingProject)}
                      >
                        <Ionicons name={isAddingProject ? 'close' : 'add'} size={15} color="#FFFFFF" />
                        <Text style={styles.addSmallBtnText}>{isAddingProject ? 'Cancelar' : 'Novo Projeto'}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Formulário de Adição de Projeto */}
                    {isAddingProject && (
                      <View style={styles.newProjectCard}>
                        <Text style={styles.newProjectCardHeader}>Cadastrar Novo Projeto</Text>

                        <Text style={styles.label}>Título do Projeto *:</Text>
                        <TextInput style={styles.input} value={newProjectName} onChangeText={setNewProjectName} placeholder="Ex: FateLink Mobile App" />

                        <Text style={styles.label}>Descrição do Projeto:</Text>
                        <TextInput style={[styles.input, { height: 70 }]} value={newProjectDesc} onChangeText={setNewProjectDesc} multiline placeholder="Explique a proposta, arquitetura e seu papel..." />

                        <Text style={styles.label}>Tecnologias Utilizadas (separadas por vírgula):</Text>
                        <TextInput style={styles.input} value={newProjectTechs} onChangeText={setNewProjectTechs} placeholder="React Native, TypeScript, Node.js" />

                        <Text style={styles.label}>URL da Imagem de Demonstração:</Text>
                        <TextInput style={styles.input} value={newProjectImage} onChangeText={setNewProjectImage} placeholder="https://exemplo.com/preview.png" />

                        <Text style={styles.label}>Link do Repositório GitHub:</Text>
                        <TextInput style={styles.input} value={newProjectGithub} onChangeText={setNewProjectGithub} placeholder="https://github.com/..." autoCapitalize="none" />

                        <Text style={styles.label}>Link de Demonstração / Deploy:</Text>
                        <TextInput style={styles.input} value={newProjectDemo} onChangeText={setNewProjectDemo} placeholder="https://meuprojeto.vercel.app" autoCapitalize="none" />

                        <TouchableOpacity style={styles.saveMainBtn} onPress={handleAddProject}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.saveMainBtnText}>Adicionar Projeto à Lista</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Lista de Projetos em Cards Profissionais */}
                    {projetos.length === 0 ? (
                      <View style={styles.emptyItemsBox}>
                        <Ionicons name="rocket-outline" size={38} color="#94A3B8" />
                        <Text style={styles.emptyItemsTitle}>Nenhum projeto cadastrado</Text>
                        <Text style={styles.emptyItemsSub}>Projetos no portfólio aumentam significativamente sua pontuação de match com as vagas.</Text>
                      </View>
                    ) : (
                      <View style={{ gap: 12, marginTop: 8 }}>
                        {projetos.map((proj, idx) => (
                          <View key={idx} style={styles.projectCard}>
                            {proj.imagemUrl ? (
                              <Image source={{ uri: proj.imagemUrl }} style={styles.projectCardImage} resizeMode="cover" />
                            ) : null}
                            <View style={styles.projectCardBody}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Text style={styles.projectCardTitle}>{proj.titulo}</Text>
                                <TouchableOpacity onPress={() => handleRemoveProject(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                              </View>
                              <Text style={styles.projectCardDesc}>{proj.descricao}</Text>

                              {/* Tecnologias */}
                              {proj.tecnologias && proj.tecnologias.length > 0 && (
                                <View style={styles.projectTechsRow}>
                                  {proj.tecnologias.map((tech, tIdx) => (
                                    <View key={tIdx} style={styles.projectTechBadge}>
                                      <Text style={styles.projectTechText}>{tech}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}

                              {/* Links do Projeto */}
                              <View style={styles.projectLinksRow}>
                                {proj.githubUrl ? (
                                  <TouchableOpacity
                                    style={styles.projectLinkBtn}
                                    onPress={() => Linking.openURL(proj.githubUrl!)}
                                  >
                                    <Ionicons name="logo-github" size={13} color="#FFFFFF" />
                                    <Text style={styles.projectLinkText}>GitHub</Text>
                                  </TouchableOpacity>
                                ) : null}
                                {proj.demoUrl ? (
                                  <TouchableOpacity
                                    style={[styles.projectLinkBtn, { backgroundColor: Colors.primary }]}
                                    onPress={() => Linking.openURL(proj.demoUrl!)}
                                  >
                                    <Ionicons name="globe-outline" size={13} color="#FFFFFF" />
                                    <Text style={styles.projectLinkText}>Demo ao Vivo</Text>
                                  </TouchableOpacity>
                                ) : null}
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {projetos.length > 0 && (
                      <TouchableOpacity style={[styles.saveMainBtn, { marginTop: 16 }]} onPress={handleSaveProfile} disabled={saving}>
                        <Ionicons name="save-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.saveMainBtnText}>{saving ? 'Salvando...' : 'Salvar Projetos no Perfil'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* 5. ABA: HABILIDADES, EXPERIÊNCIAS E CERTIFICAÇÕES */}
                {activeTab === 'experiencias' && (
                  <View style={styles.sectionWrap}>
                    {/* Competências Técnicas */}
                    <Text style={styles.formSectionTitle}>Competências Técnicas ({competencias.length})</Text>
                    <View style={styles.addInlineRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        value={newSkillText}
                        onChangeText={setNewSkillText}
                        placeholder="Adicionar competência (ex: Docker)"
                      />
                      <TouchableOpacity style={styles.addInlineBtn} onPress={handleAddCompetencia}>
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.chipsWrap}>
                      {competencias.map((comp, idx) => (
                        <View key={idx} style={styles.skillPill}>
                          <Text style={styles.skillPillText}>{comp}</Text>
                          <TouchableOpacity onPress={() => handleRemoveCompetencia(comp)}>
                            <Ionicons name="close-circle" size={15} color="#94A3B8" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>

                    {/* Certificações */}
                    <Text style={[styles.formSectionTitle, { marginTop: 20 }]}>Certificações & Cursos ({certificacoes.length})</Text>
                    <View style={styles.addInlineRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        value={newCertText}
                        onChangeText={setNewCertText}
                        placeholder="Ex: Certificação AWS Cloud Practitioner"
                      />
                      <TouchableOpacity style={styles.addInlineBtn} onPress={handleAddCertificacao}>
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <View style={{ gap: 6 }}>
                      {certificacoes.map((cert, idx) => (
                        <View key={idx} style={styles.certRow}>
                          <Ionicons name="ribbon-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                          <Text style={styles.certRowText} numberOfLines={1}>{cert}</Text>
                          <TouchableOpacity onPress={() => handleRemoveCertificacao(cert)}>
                            <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>

                    {/* Experiências Anteriores */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                      <Text style={styles.formSectionTitle}>Experiências Anteriores ({experiencias.length})</Text>
                      <TouchableOpacity
                        style={styles.addSmallBtn}
                        onPress={() => setIsAddingExp(!isAddingExp)}
                      >
                        <Ionicons name={isAddingExp ? 'close' : 'add'} size={15} color="#FFFFFF" />
                        <Text style={styles.addSmallBtnText}>{isAddingExp ? 'Cancelar' : 'Nova'}</Text>
                      </TouchableOpacity>
                    </View>

                    {isAddingExp && (
                      <View style={styles.newProjectCard}>
                        <Text style={styles.newProjectCardHeader}>Cadastrar Experiência</Text>
                        <Text style={styles.label}>Cargo / Função *:</Text>
                        <TextInput style={styles.input} value={newExpCargo} onChangeText={setNewExpCargo} placeholder="Ex: Estagiário de Desenvolvimento" />

                        <Text style={styles.label}>Empresa *:</Text>
                        <TextInput style={styles.input} value={newExpEmpresa} onChangeText={setNewExpEmpresa} placeholder="Ex: Tech Solutions FATEC" />

                        <Text style={styles.label}>Período:</Text>
                        <TextInput style={styles.input} value={newExpPeriodo} onChangeText={setNewExpPeriodo} placeholder="Ex: Jan/2024 - Atual" />

                        <Text style={styles.label}>Descrição das Atividades:</Text>
                        <TextInput style={[styles.input, { height: 70 }]} value={newExpDesc} onChangeText={setNewExpDesc} multiline placeholder="Resuma suas responsabilidades e tecnologias..." />

                        <TouchableOpacity style={styles.saveMainBtn} onPress={handleAddExperiencia}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.saveMainBtnText}>Adicionar Experiência</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <View style={{ gap: 8, marginTop: 8 }}>
                      {experiencias.map((exp, idx) => (
                        <View key={idx} style={styles.expCard}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={styles.expCardTitle}>{exp.cargo}</Text>
                            <TouchableOpacity onPress={() => setExperiencias(experiencias.filter((_, i) => i !== idx))}>
                              <Ionicons name="trash-outline" size={15} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.expCardSub}>{exp.empresa} • {exp.periodo}</Text>
                          {exp.descricao ? <Text style={styles.expCardDesc}>{exp.descricao}</Text> : null}
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity style={[styles.saveMainBtn, { marginTop: 16 }]} onPress={handleSaveProfile} disabled={saving}>
                      <Ionicons name="save-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.saveMainBtnText}>{saving ? 'Salvando...' : 'Salvar Habilidades no Perfil'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {/* Botão de Logout */}
            <View style={styles.logoutSection}>
              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                <Ionicons name="log-out-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.logoutBtnText}>Sair da Conta (Logout)</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    maxHeight: '92%',
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bannerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  userRoleText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  editPhotoBox: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
  },
  editPhotoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  photoCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoCancelBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  photoSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  photoSaveBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  missingTipBox: {
    marginTop: 6,
  },
  missingTipText: {
    fontSize: 11,
    color: '#64748B',
  },
  missingTipBoxSuccess: {
    marginTop: 6,
  },
  missingTipSuccessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  sectionWrap: {
    gap: 12,
  },
  cardBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
  },
  cardBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardBoxDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  quickOpenBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickOpenBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
  },
  metricItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  metricItemVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  linkLine: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  linkLineVal: {
    color: '#0F172A',
    fontWeight: '700',
  },
  checklistCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  checklistTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 4,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  checklistItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  miniChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  miniChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  saveMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  saveMainBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resumeActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  pdfIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeActiveTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  resumeActiveSub: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  resumeActiveUrl: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  resumeEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    gap: 6,
  },
  resumeEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  resumeEmptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  viewPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 11,
    borderRadius: 12,
  },
  viewPdfBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  uploadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 11,
    borderRadius: 12,
  },
  uploadPdfBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  deletePdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  deletePdfBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  addSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  newProjectCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  newProjectCardHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyItemsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
    gap: 6,
  },
  emptyItemsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  emptyItemsSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
  projectCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  projectCardImage: {
    width: '100%',
    height: 120,
  },
  projectCardBody: {
    padding: 12,
    gap: 6,
  },
  projectCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  projectCardDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  projectTechsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  projectTechBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  projectTechText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  projectLinksRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  projectLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  projectLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addInlineBtn: {
    backgroundColor: Colors.primary,
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
  },
  skillPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  certRowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  expCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  expCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  expCardSub: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  expCardDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  logoutSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
});
