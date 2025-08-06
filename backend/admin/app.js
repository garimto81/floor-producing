// WSOP Field Director Pro - Admin Panel JavaScript
// 백엔드 API와 연동되는 관리 대시보드

// API 기본 설정
const API_BASE_URL = 'http://localhost:3003';
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

// Alpine.js 앱 데이터
function adminApp() {
  return {
    // 상태 관리
    isAuthenticated: false,
    user: null,
    activeTab: 'dashboard',
    loading: false,
    error: null,
    success: null,

    // 로그인 폼 데이터
    loginForm: {
      email: 'director@wsop.com',
      password: 'director123',
      showPassword: false
    },

    // 대시보드 데이터
    dashboard: {
      stats: {
        totalUsers: 0,
        activeTournaments: 0,
        completedChecklists: 0,
        upcomingTasks: 0
      },
      systemStatus: {
        database: 'unknown',
        redis: 'unknown',
        server: 'unknown'
      },
      recentActivities: []
    },

    // 토너먼트 데이터
    tournaments: {
      list: [],
      form: {
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        maxPlayers: 500,
        isActive: true
      },
      editingId: null,
      showForm: false
    },
    showTournamentForm: false,

    // 체크리스트 데이터
    checklists: {
      templates: [],
      form: {
        name: '',
        description: '',
        category: 'TECHNICAL',
        items: []
      },
      newItem: {
        title: '',
        description: '',
        isRequired: true,
        estimatedMinutes: 10
      },
      editingId: null,
      showForm: false
    },
    showChecklistForm: false,

    // 일정 관리 데이터
    schedules: {
      list: [],
      form: {
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'MEETING',
        location: '',
        assignedUserId: ''
      },
      editingId: null
    },

    // 팀 관리 데이터
    teams: {
      list: [],
      form: {
        name: '',
        description: '',
        leaderId: '',
        members: []
      },
      editingId: null
    },

    // 사용자 관리 데이터
    users: {
      list: [],
      form: {
        name: '',
        email: '',
        password: '',
        role: 'FIELD_MEMBER',
        isActive: true
      },
      editingId: null
    },

    // 초기화 함수
    async init() {
      console.log('🚀 Admin Panel 초기화 중...');
      
      // 저장된 토큰 확인
      if (authToken) {
        try {
          await this.verifyToken();
        } catch (error) {
          console.error('토큰 검증 실패:', error);
          authToken = null;
          localStorage.removeItem('admin_token');
        }
      }

      // 로그인 상태가 아니면 로그인 화면으로
      if (!this.isAuthenticated) {
        this.activeTab = 'login';
      } else {
        // 대시보드 데이터 로드
        await this.loadDashboardData();
      }
    },

    // 토큰 검증
    async verifyToken() {
      try {
        const response = await api.call('/api/auth/profile');
        if (response && response.user) {
          this.user = response.user;
          this.isAuthenticated = true;
          return true;
        }
      } catch (error) {
        console.error('토큰 검증 오류:', error);
      }
      return false;
    },

    // 로그인 처리
    async login() {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.call('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: this.loginForm.email,
            password: this.loginForm.password
          })
        });

        if (response && response.token) {
          authToken = response.token;
          localStorage.setItem('admin_token', authToken);
          this.user = response.user;
          this.isAuthenticated = true;
          this.activeTab = 'dashboard';
          
          this.showSuccess('로그인 성공!');
          await this.loadDashboardData();
        }
      } catch (error) {
        this.showError('로그인 실패: ' + error.message);
      } finally {
        this.loading = false;
      }
    },

    // 로그아웃 처리
    logout() {
      authToken = null;
      localStorage.removeItem('admin_token');
      this.isAuthenticated = false;
      this.user = null;
      this.activeTab = 'login';
      this.showSuccess('로그아웃되었습니다.');
    },

    // 탭 전환
    switchTab(tabName) {
      if (!this.isAuthenticated && tabName !== 'login') {
        return;
      }
      
      this.activeTab = tabName;
      this.error = null;
      this.success = null;

      // 탭별 데이터 로드
      switch(tabName) {
        case 'dashboard':
          this.loadDashboardData();
          break;
        case 'tournaments':
          this.loadTournaments();
          break;
        case 'checklists':
          this.loadChecklists();
          break;
        case 'schedules':
          this.loadSchedules();
          break;
        case 'teams':
          this.loadTeams();
          break;
        case 'users':
          this.loadUsers();
          break;
      }
    },

    // 대시보드 데이터 로드
    async loadDashboardData() {
      try {
        this.loading = true;

        // 시스템 상태 확인
        const dbStatus = await api.call('/api/db-status');
        if (dbStatus) {
          this.dashboard.systemStatus.database = dbStatus.status;
          this.dashboard.stats.totalUsers = dbStatus.userCount;
        }

        // 사용자 목록 가져오기
        const usersResponse = await api.call('/api/users', null, authToken);
        if (usersResponse && usersResponse.users) {
          this.stats.totalUsers = usersResponse.users.length;
          this.users = usersResponse.users;
        }

        // 최근 활동 시뮬레이션
        this.recentActivities = [
          {
            id: 1,
            time: '5분 전',
            message: '새 사용자가 등록되었습니다',
            user: 'system'
          },
          {
            id: 2,
            time: '15분 전', 
            message: '데이터베이스 백업이 완료되었습니다',
            user: 'system'
          },
          {
            id: 3,
            time: '1시간 전',
            message: this.user?.name + '님이 로그인했습니다',
            user: this.user?.email
          }
        ];

        // 더미 데이터 추가
        this.tournaments = [
          {
            id: 1,
            name: 'WSOP Super Circuit CYPRUS 2024',
            location: 'Merit Crystal Cove, Cyprus',
            startDate: '2024-10-15',
            endDate: '2024-10-25',
            status: 'UPCOMING'
          }
        ];

        this.checklistTemplates = [
          {
            id: 1,
            name: '카메라 셋업 체크리스트',
            category: 'TECHNICAL',
            timeSlot: 'MORNING',
            priority: 'HIGH'
          }
        ];

        this.schedules = [
          {
            id: 1,
            title: '프로덕션 팀 미팅',
            description: '일일 촬영 계획 논의',
            startTime: '09:00',
            type: 'MEETING'
          }
        ];

        this.teams = [
          {
            id: 1,
            name: '카메라 팀',
            memberCount: 8,
            leader: 'John Doe'
          }
        ];

      } catch (error) {
        console.error('대시보드 로드 오류:', error);
        this.showError('대시보드 데이터를 불러오는데 실패했습니다.');
      } finally {
        this.loading = false;
      }
    },

    // 사용자 목록 로드
    async loadUsers() {
      try {
        this.loading = true;
        const response = await api.call('/api/users', null, authToken);
        
        if (response && response.users) {
          this.users = response.users;
          this.stats.totalUsers = response.users.length;
        }
      } catch (error) {
        this.showError('사용자 목록을 불러오는데 실패했습니다.');
      } finally {
        this.loading = false;
      }
    },

    // 사용자 등록
    async createUser() {
      try {
        this.loading = true;
        
        const userData = {
          name: '새 사용자',
          email: `user-${Date.now()}@wsop.com`,
          password: 'password123',
          role: 'FIELD_MEMBER'
        };
        
        const response = await api.call('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData)
        });

        if (response) {
          this.showSuccess('사용자가 성공적으로 등록되었습니다.');
          await this.loadUsers();
        }
      } catch (error) {
        this.showError('사용자 등록 실패: ' + error.message);
      } finally {
        this.loading = false;
      }
    },

    // 토너먼트 목록 로드 (현재는 모의 데이터)
    loadTournaments() {
      // 이미 init에서 로드됨
    },

    // 새 토너먼트 생성
    async createTournament() {
      try {
        this.loading = true;
        this.error = null;
        
        // 폼 유효성 검사
        if (!this.tournaments.form.name) {
          this.showError('토너먼트 이름을 입력해주세요.');
          return;
        }
        
        // 현재는 로컬 리스트에 추가
        const newTournament = {
          id: Date.now(),
          ...this.tournaments.form,
          status: 'UPCOMING',
          createdAt: new Date().toISOString()
        };
        
        this.tournaments.list.push(newTournament);
        
        // 폼 초기화
        this.resetTournamentForm();
        this.showTournamentForm = false;
        this.showSuccess('토너먼트가 성공적으로 생성되었습니다.');
        
      } catch (error) {
        this.showError('토너먼트 생성 실패: ' + error.message);
      } finally {
        this.loading = false;
      }
    },

    // 체크리스트 목록 로드 (현재는 모의 데이터)
    loadChecklists() {
      // 이미 init에서 로드됨
    },

    // 새 체크리스트 템플릿 생성
    async createChecklistTemplate() {
      try {
        this.loading = true;
        this.error = null;
        
        // 폼 유효성 검사
        if (!this.checklists.form.name) {
          this.showError('체크리스트 이름을 입력해주세요.');
          return;
        }
        
        // 현재는 로컬 리스트에 추가
        const newChecklist = {
          id: Date.now(),
          ...this.checklists.form,
          itemCount: this.checklists.form.items.length,
          createdAt: new Date().toISOString()
        };
        
        this.checklists.templates.push(newChecklist);
        
        // 폼 초기화
        this.resetChecklistForm();
        this.showChecklistForm = false;
        this.showSuccess('체크리스트 템플릿이 성공적으로 생성되었습니다.');
        
      } catch (error) {
        this.showError('체크리스트 생성 실패: ' + error.message);
      } finally {
        this.loading = false;
      }
    },

    // 일정 목록 로드 (현재는 모의 데이터)
    loadSchedules() {
      // 이미 init에서 로드됨
    },

    // 팀 목록 로드 (현재는 모의 데이터)
    loadTeams() {
      // 이미 init에서 로드됨
    },

    // 폼 리셋 함수들
    resetUserForm() {
      console.log('사용자 폼 리셋');
    },

    resetTournamentForm() {
      this.tournaments.form = {
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        maxPlayers: 500,
        isActive: true
      };
      this.tournaments.editingId = null;
    },

    resetChecklistForm() {
      this.checklists.form = {
        name: '',
        description: '',
        category: 'TECHNICAL',
        items: []
      };
      this.checklists.newItem = {
        title: '',
        description: '',
        isRequired: true,
        estimatedMinutes: 10
      };
      this.checklists.editingId = null;
    },

    // 체크리스트 아이템 추가
    addChecklistItem() {
      if (!this.checklists.newItem.title) {
        this.showError('아이템 제목을 입력해주세요.');
        return;
      }
      
      const newItem = {
        id: Date.now(),
        ...this.checklists.newItem
      };
      
      this.checklists.form.items.push(newItem);
      
      // 새 아이템 폼 리셋
      this.checklists.newItem = {
        title: '',
        description: '',
        isRequired: true,
        estimatedMinutes: 10
      };
    },

    // 체크리스트 아이템 제거
    removeChecklistItem(index) {
      if (index >= 0 && index < this.checklists.form.items.length) {
        this.checklists.form.items.splice(index, 1);
      }
    },

    // 메시지 표시 함수들
    showError(message) {
      this.error = message;
      this.success = null;
      setTimeout(() => {
        this.error = null;
      }, 5000);
    },

    showSuccess(message) {
      this.success = message;
      this.error = null;
      setTimeout(() => {
        this.success = null;
      }, 3000);
    },

    // 누락된 상태 변수들 추가
    notification: {
      show: false,
      message: '',
      type: 'info'
    },

    // 데이터 변수들 초기화
    stats: {
      totalUsers: 0,
      activeTournaments: 1,
      totalChecklists: 5,
      upcomingSchedules: 3
    },

    recentActivities: [],
    tournaments: [],
    checklistTemplates: [],
    schedules: [],
    teams: [],
    users: [],

    // 폼 표시 상태
    showTournamentForm: false,
    showChecklistForm: false,
    showScheduleForm: false,
    showTeamForm: false,

    // 편집 상태
    editingChecklistTemplate: null,

    // 폼 데이터들
    checklistForm: {
      name: '',
      category: 'TECHNICAL',
      timeSlot: 'MORNING',
      priority: 'MEDIUM'
    },

    // 더미 함수들 (실제 구현 필요)
    editTournament(tournament) {
      console.log('토너먼트 편집:', tournament);
      this.showSuccess('토너먼트 편집 기능은 곧 구현됩니다.');
    },

    deleteTournament(id) {
      console.log('토너먼트 삭제:', id);
      this.showSuccess('토너먼트 삭제 기능은 곧 구현됩니다.');
    },

    editChecklistTemplate(template) {
      console.log('체크리스트 편집:', template);
      this.showSuccess('체크리스트 편집 기능은 곧 구현됩니다.');
    },

    deleteChecklistTemplate(id) {
      console.log('체크리스트 삭제:', id);
      this.showSuccess('체크리스트 삭제 기능은 곧 구현됩니다.');
    },

    resetChecklistForm() {
      this.checklistForm = {
        name: '',
        category: 'TECHNICAL',
        timeSlot: 'MORNING',
        priority: 'MEDIUM'
      };
      this.editingChecklistTemplate = null;
      this.showChecklistForm = false;
    },

    editSchedule(schedule) {
      console.log('일정 편집:', schedule);
      this.showSuccess('일정 편집 기능은 곧 구현됩니다.');
    },

    deleteSchedule(id) {
      console.log('일정 삭제:', id);
      this.showSuccess('일정 삭제 기능은 곧 구현됩니다.');
    },

    editTeam(team) {
      console.log('팀 편집:', team);
      this.showSuccess('팀 편집 기능은 곧 구현됩니다.');
    },

    deleteTeam(id) {
      console.log('팀 삭제:', id);
      this.showSuccess('팀 삭제 기능은 곧 구현됩니다.');
    },

    toggleUserStatus(user) {
      console.log('사용자 상태 토글:', user);
      user.isActive = !user.isActive;
      this.showSuccess(`사용자가 ${user.isActive ? '활성화' : '비활성화'}되었습니다.`);
    },

    // 유틸리티 함수들
    formatDate(dateString) {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('ko-KR');
    },

    formatDateTime(dateString) {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleString('ko-KR');
    },

    getRoleDisplayName(role) {
      const roleNames = {
        'DIRECTOR': '총괄 디렉터',
        'TECHNICAL_DIRECTOR': '기술 감독',
        'FIELD_MEMBER': '현장 팀원',
        'CONTENT_PRODUCER': '콘텐츠 프로듀서'
      };
      return roleNames[role] || role;
    },

    getStatusBadgeClass(status) {
      return {
        'bg-green-100 text-green-800': status === 'connected' || status === 'healthy' || status === true,
        'bg-red-100 text-red-800': status === 'disconnected' || status === 'error' || status === false,
        'bg-yellow-100 text-yellow-800': status === 'unknown' || status === 'warning'
      };
    }
  }
}

// Alpine.js 초기화 후 실행
document.addEventListener('alpine:init', () => {
  console.log('🎬 WSOP Field Director Pro - Admin Panel 시작');
});

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 관리 패널이 준비되었습니다.');
});