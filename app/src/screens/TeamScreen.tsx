import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { 
  Card, 
  List, 
  Avatar, 
  Chip, 
  useTheme,
  Searchbar,
  SegmentedButtons 
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TeamMember } from '../types';

const TEAM_MEMBERS: TeamMember[] = [
  { id: '1', name: '김철수', role: '외주 관리 PM', status: 'active', phone: '+82-10-1111-1111' },
  { id: '2', name: '이영희', role: '현장 총괄 보조', status: 'active', phone: '+82-10-2222-2222' },
  { id: '3', name: '박민수', role: '피처 테이블 스위처', status: 'active', phone: '+82-10-3333-3333' },
  { id: '4', name: '최지현', role: 'FR7 PTZ 카메라', status: 'break', phone: '+82-10-4444-4444' },
  { id: '5', name: '정대호', role: '프리 카메라', status: 'active', phone: '+82-10-5555-5555' },
  { id: '6', name: '한소영', role: '소프트 콘텐츠 PD', status: 'active', phone: '+82-10-6666-6666' },
  { id: '7', name: '강민준', role: '기술 담당', status: 'active', phone: '+82-10-7777-7777' },
  { id: '8', name: '임수진', role: '크리에이터 PM', status: 'offline', phone: '+82-10-8888-8888' },
];

export default function TeamScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'break': return theme.colors.warning;
      case 'offline': return theme.colors.error;
      default: return theme.colors.onSurface;
    }
  };

  const getStatusText = (status: TeamMember['status']) => {
    switch (status) {
      case 'active': return '활동중';
      case 'break': return '휴식';
      case 'offline': return '오프라인';
      default: return status;
    }
  };

  const filteredMembers = TEAM_MEMBERS.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    active: TEAM_MEMBERS.filter(m => m.status === 'active').length,
    break: TEAM_MEMBERS.filter(m => m.status === 'break').length,
    offline: TEAM_MEMBERS.filter(m => m.status === 'offline').length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="팀원 검색"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={[
            { 
              value: 'all', 
              label: `전체 (${TEAM_MEMBERS.length})` 
            },
            { 
              value: 'active', 
              label: `활동 (${statusCounts.active})`,
              checkedColor: theme.colors.success
            },
            { 
              value: 'break', 
              label: `휴식 (${statusCounts.break})`,
              checkedColor: theme.colors.warning
            },
            { 
              value: 'offline', 
              label: `오프 (${statusCounts.offline})`,
              checkedColor: theme.colors.error
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: theme.colors.success }]}>
                  {statusCounts.active}
                </Text>
                <Text style={styles.summaryLabel}>활동중</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: theme.colors.warning }]}>
                  {statusCounts.break}
                </Text>
                <Text style={styles.summaryLabel}>휴식</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: theme.colors.error }]}>
                  {statusCounts.offline}
                </Text>
                <Text style={styles.summaryLabel}>오프라인</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <List.Section>
              {filteredMembers.map((member) => (
                <List.Item
                  key={member.id}
                  title={member.name}
                  description={member.role}
                  left={() => (
                    <Avatar.Text 
                      size={40} 
                      label={member.name.substring(0, 2)}
                      style={{ backgroundColor: getStatusColor(member.status) }}
                    />
                  )}
                  right={() => (
                    <Chip 
                      mode="flat" 
                      compact
                      style={{ 
                        backgroundColor: getStatusColor(member.status) + '20' 
                      }}
                      textStyle={{ 
                        color: getStatusColor(member.status),
                        fontSize: 12,
                      }}
                    >
                      {getStatusText(member.status)}
                    </Chip>
                  )}
                  onPress={() => {/* 상세 정보 보기 */}}
                  style={styles.listItem}
                />
              ))}
            </List.Section>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  searchbar: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  summaryCard: {
    margin: 16,
    marginTop: 0,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  listItem: {
    paddingVertical: 8,
  },
});