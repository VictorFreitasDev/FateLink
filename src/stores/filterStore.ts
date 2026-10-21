import { create } from 'zustand';
import { FeedFilterCriteria, UserRole, SortOption } from '../types';

export const DEFAULT_STUDENT_FILTERS: FeedFilterCriteria = {
  curso: 'Todos os Cursos',
  area: 'Todas as Áreas',
  modalidade: 'Todas',
  tipo: 'Todos',
  localizacao: 'Todas',
  faixa: 'Qualquer valor',
  minBolsa: 0,
  competencias: [],
  minMatch: 0,
  sortBy: 'relevancia',
};

export const DEFAULT_COMPANY_FILTERS: FeedFilterCriteria = {
  curso: 'Todos os Cursos',
  unidadeFatec: 'Todas as Unidades',
  semestre: 'Todos os Semestres',
  disponibilidade: 'Todas',
  competencias: [],
  minMatch: 0,
  sortBy: 'relevancia',
};

interface FilterState {
  studentFilters: FeedFilterCriteria;
  companyFilters: FeedFilterCriteria;
  setStudentFilters: (filters: Partial<FeedFilterCriteria>) => void;
  setCompanyFilters: (filters: Partial<FeedFilterCriteria>) => void;
  resetStudentFilters: () => void;
  resetCompanyFilters: () => void;
  getFiltersForRole: (role: UserRole) => FeedFilterCriteria;
  getActiveFiltersCount: (role: UserRole) => number;
  removeFilterKey: (role: UserRole, key: keyof FeedFilterCriteria, skillToRemove?: string) => void;
  setSortBy: (role: UserRole, sortBy: SortOption) => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  studentFilters: { ...DEFAULT_STUDENT_FILTERS },
  companyFilters: { ...DEFAULT_COMPANY_FILTERS },

  setStudentFilters: (newFilters) =>
    set((state) => ({
      studentFilters: { ...state.studentFilters, ...newFilters },
    })),

  setCompanyFilters: (newFilters) =>
    set((state) => ({
      companyFilters: { ...state.companyFilters, ...newFilters },
    })),

  resetStudentFilters: () =>
    set({
      studentFilters: { ...DEFAULT_STUDENT_FILTERS },
    }),

  resetCompanyFilters: () =>
    set({
      companyFilters: { ...DEFAULT_COMPANY_FILTERS },
    }),

  getFiltersForRole: (role: UserRole) => {
    return role === 'aluno' ? get().studentFilters : get().companyFilters;
  },

  getActiveFiltersCount: (role: UserRole) => {
    const f = role === 'aluno' ? get().studentFilters : get().companyFilters;
    let count = 0;
    if (f.curso && f.curso !== 'Todos os Cursos') count++;
    if (f.area && f.area !== 'Todas as Áreas') count++;
    if (f.modalidade && f.modalidade !== 'Todas') count++;
    if (f.tipo && f.tipo !== 'Todos') count++;
    if (f.localizacao && f.localizacao !== 'Todas') count++;
    if (f.faixa && f.faixa !== 'Qualquer valor') count++;
    if (f.minBolsa && f.minBolsa > 0) count++;
    if (f.competencias && f.competencias.length > 0) count += f.competencias.length;
    if (f.minMatch && f.minMatch > 0) count++;
    if (f.sortBy && f.sortBy !== 'relevancia') count++;
    if (f.unidadeFatec && f.unidadeFatec !== 'Todas as Unidades') count++;
    if (f.semestre && f.semestre !== 'Todos os Semestres') count++;
    if (f.disponibilidade && f.disponibilidade !== 'Todas') count++;
    return count;
  },

  removeFilterKey: (role: UserRole, key: keyof FeedFilterCriteria, skillToRemove?: string) => {
    const isAluno = role === 'aluno';
    const target = isAluno ? { ...get().studentFilters } : { ...get().companyFilters };

    if (key === 'competencias') {
      if (skillToRemove) {
        target.competencias = (target.competencias || []).filter((s) => s !== skillToRemove);
      } else {
        target.competencias = [];
      }
    } else if (key === 'curso') {
      target.curso = 'Todos os Cursos';
    } else if (key === 'area') {
      target.area = 'Todas as Áreas';
    } else if (key === 'modalidade') {
      target.modalidade = 'Todas';
    } else if (key === 'tipo') {
      target.tipo = 'Todos';
    } else if (key === 'localizacao') {
      target.localizacao = 'Todas';
    } else if (key === 'faixa') {
      target.faixa = 'Qualquer valor';
      target.minBolsa = 0;
    } else if (key === 'minBolsa') {
      target.minBolsa = 0;
      target.faixa = 'Qualquer valor';
    } else if (key === 'minMatch') {
      target.minMatch = 0;
    } else if (key === 'sortBy') {
      target.sortBy = 'relevancia';
    } else if (key === 'unidadeFatec') {
      target.unidadeFatec = 'Todas as Unidades';
    } else if (key === 'semestre') {
      target.semestre = 'Todos os Semestres';
    } else if (key === 'disponibilidade') {
      target.disponibilidade = 'Todas';
    }

    if (isAluno) {
      set({ studentFilters: target });
    } else {
      set({ companyFilters: target });
    }
  },

  setSortBy: (role: UserRole, sortBy: SortOption) => {
    if (role === 'aluno') {
      set((state) => ({
        studentFilters: { ...state.studentFilters, sortBy },
      }));
    } else {
      set((state) => ({
        companyFilters: { ...state.companyFilters, sortBy },
      }));
    }
  },
}));

