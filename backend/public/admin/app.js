// WSOP Field Director Pro - Admin Panel JavaScript
// 백엔드 API와 연동되는 관리 대시보드

// API 기본 설정 - 프로덕션 환경
const API_BASE_URL = 'https://wsop-field-director-backend.vercel.app';
let authToken = localStorage.getItem('admin_token');

// API 호출 헬퍼 함수
const api = {
  async call(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (response.status === 401) {
        this.handleAuthError();
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '요청 처리 중 오류가 발생했습니다.');
      }

      return data;
    } catch (error) {
      console.error('API 호출 오류:', error);
      throw error;
    }
  },

  handleAuthError() {
    authToken = null;
    localStorage.removeItem('admin_token');
    window.location.reload();
  }
};

// Alpine.js 메인 앱
document.addEventListener('alpine:init', () => {
  Alpine.data('adminApp', () => ({
    // 인증 상태
    isAuthenticated: false,
    user: null,
    authToken: authToken,

    // UI 상태
    activeTab: 'dashboard',
    notification: {
      show: false,
      type: 'success',
      message: ''
    },

    // 로그인 폼
    loginForm: {
      email: 'director@wsop.com',
      password: 'director123'
    },

    // 데이터
    stats: {
      totalUsers: 0,
      activeTournaments: 0,
      totalChecklists: 0,
      upcomingSchedules: 0
    },
    users: [],
    tournaments: [],
    checklistTemplates: [],
    schedules: [],
    teams: [],
    recentActivities: [
      {
        id: 1,
        message: '백엔드 API가 Vercel에 성공적으로 배포되었습니다.',
        time: '방금 전'
      },
      {
        id: 2,
        message: '데이터베이스 연결이 정상적으로 설정되었습니다.',
        time: '1분 전'
      },
      {
        id: 3,
        message: '관리자 패널이 활성화되었습니다.',
        time: '2분 전'
      }
    ],

    // 폼 데이터
    tournamentForm: {
      name: '',
      location: '',
      startDate: '',
      endDate: '',
      status: 'UPCOMING'
    },

    checklistForm: {
      name: '',
      category: '',
      timeSlot: 'MORNING',
      priority: 'MEDIUM'
    },

    scheduleForm: {
      title: '',
      description: '',
      date: '',
      type: 'EVENT'
    },

    teamForm: {
      name: '',
      description: '',
      color: '#3B82F6'
    },

    // 편집 상태
    editingTournament: null,
    editingChecklistTemplate: null,
    editingSchedule: null,
    editingTeam: null,

    // 모달 상태
    showTournamentForm: false,
    showChecklistForm: false,
    showScheduleForm: false,
    showTeamForm: false,

    // 초기화
    init() {
      if (this.authToken) {
        this.isAuthenticated = true;
        this.loadUserData();
        this.loadDashboardData();
      }
    },

    // 인증
    async login() {
      try {
        const data = await api.call('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(this.loginForm)
        });

        if (data && data.token) {
          this.authToken = data.token;
          authToken = data.token;
          localStorage.setItem('admin_token', data.token);
          
          this.user = data.user;
          this.isAuthenticated = true;
          
          this.showNotification('성공적으로 로그인되었습니다.', 'success');
          await this.loadDashboardData();
        }
      } catch (error) {
        this.showNotification(error.message || '로그인에 실패했습니다.', 'error');
      }
    },

    logout() {
      this.authToken = null;
      authToken = null;
      localStorage.removeItem('admin_token');
      this.isAuthenticated = false;
      this.user = null;
    },

    async loadUserData() {
      try {
        const data = await api.call('/api/auth/profile');
        if (data) {
          this.user = data.user;
        }
      } catch (error) {
        console.error('사용자 데이터 로드 오류:', error);
      }
    },

    // 대시보드 데이터 로드
    async loadDashboardData() {
      try {
        // 데이터베이스 상태 확인
        const dbStatus = await api.call('/api/db-status');
        if (dbStatus) {
          this.stats.totalUsers = dbStatus.userCount || 0;
        }

        // 사용자 목록 로드
        const users = await api.call('/api/users');
        if (users) {
          this.users = users.users || [];
        }

        // 통계 업데이트
        this.stats.activeTournaments = this.tournaments.filter(t => t.status === 'ACTIVE').length;
        this.stats.totalChecklists = this.checklistTemplates.length;
        this.stats.upcomingSchedules = this.schedules.filter(s => new Date(s.date) > new Date()).length;

      } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
      }
    },

    // 알림 표시
    showNotification(message, type = 'success') {
      this.notification.message = message;
      this.notification.type = type;
      this.notification.show = true;
      
      setTimeout(() => {
        this.notification.show = false;
      }, 5000);
    },

    // 사용자 관리
    async toggleUserStatus(user) {
      try {
        const data = await api.call(`/api/users/${user.id}/toggle`, {
          method: 'PUT'
        });
        
        if (data) {
          user.isActive = !user.isActive;
          this.showNotification(`사용자 상태가 ${user.isActive ? '활성화' : '비활성화'}되었습니다.`);
        }
      } catch (error) {
        this.showNotification(error.message || '사용자 상태 변경에 실패했습니다.', 'error');
      }
    },

    // 토너먼트 관리
    editTournament(tournament) {
      this.editingTournament = tournament;
      this.tournamentForm = { ...tournament };
      this.showTournamentForm = true;
    },

    async deleteTournament(id) {
      if (confirm('정말로 이 토너먼트를 삭제하시겠습니까?')) {
        try {
          await api.call(`/api/tournaments/${id}`, {
            method: 'DELETE'
          });
          
          this.tournaments = this.tournaments.filter(t => t.id !== id);
          this.showNotification('토너먼트가 삭제되었습니다.');
        } catch (error) {
          this.showNotification(error.message || '토너먼트 삭제에 실패했습니다.', 'error');
        }
      }
    },

    // 체크리스트 템플릿 관리
    editChecklistTemplate(template) {
      this.editingChecklistTemplate = template;
      this.checklistForm = { ...template };
      this.showChecklistForm = true;
    },

    async deleteChecklistTemplate(id) {
      if (confirm('정말로 이 체크리스트 템플릿을 삭제하시겠습니까?')) {
        try {
          await api.call(`/api/checklists/templates/${id}`, {
            method: 'DELETE'
          });
          
          this.checklistTemplates = this.checklistTemplates.filter(t => t.id !== id);
          this.showNotification('체크리스트 템플릿이 삭제되었습니다.');
        } catch (error) {
          this.showNotification(error.message || '체크리스트 템플릿 삭제에 실패했습니다.', 'error');
        }
      }
    },

    async saveChecklistTemplate() {
      try {
        const endpoint = this.editingChecklistTemplate 
          ? `/api/checklists/templates/${this.editingChecklistTemplate.id}`
          : '/api/checklists/templates';
        
        const method = this.editingChecklistTemplate ? 'PUT' : 'POST';
        
        const data = await api.call(endpoint, {
          method,
          body: JSON.stringify(this.checklistForm)
        });

        if (data) {
          if (this.editingChecklistTemplate) {
            const index = this.checklistTemplates.findIndex(t => t.id === this.editingChecklistTemplate.id);
            this.checklistTemplates[index] = data.template;
          } else {
            this.checklistTemplates.push(data.template);
          }
          
          this.resetChecklistForm();
          this.showNotification('체크리스트 템플릿이 저장되었습니다.');
        }
      } catch (error) {
        this.showNotification(error.message || '체크리스트 템플릿 저장에 실패했습니다.', 'error');
      }
    },

    resetChecklistForm() {
      this.editingChecklistTemplate = null;
      this.checklistForm = {
        name: '',
        category: '',
        timeSlot: 'MORNING',
        priority: 'MEDIUM'
      };
      this.showChecklistForm = false;
    },

    // 일정 관리
    editSchedule(schedule) {
      this.editingSchedule = schedule;
      this.scheduleForm = { ...schedule };
      this.showScheduleForm = true;
    },

    async deleteSchedule(id) {
      if (confirm('정말로 이 일정을 삭제하시겠습니까?')) {
        try {
          await api.call(`/api/schedules/${id}`, {
            method: 'DELETE'
          });
          
          this.schedules = this.schedules.filter(s => s.id !== id);
          this.showNotification('일정이 삭제되었습니다.');
        } catch (error) {
          this.showNotification(error.message || '일정 삭제에 실패했습니다.', 'error');
        }
      }
    },

    // 팀 관리
    editTeam(team) {
      this.editingTeam = team;
      this.teamForm = { ...team };
      this.showTeamForm = true;
    },

    async deleteTeam(id) {
      if (confirm('정말로 이 팀을 삭제하시겠습니까?')) {
        try {
          await api.call(`/api/teams/${id}`, {
            method: 'DELETE'
          });
          
          this.teams = this.teams.filter(t => t.id !== id);
          this.showNotification('팀이 삭제되었습니다.');
        } catch (error) {
          this.showNotification(error.message || '팀 삭제에 실패했습니다.', 'error');
        }
      }
    }
  }));
});

// 초기 데이터 설정
document.addEventListener('DOMContentLoaded', () => {
  console.log('WSOP Field Director Pro - Admin Panel 로드됨');
  console.log('API Base URL:', API_BASE_URL);
});