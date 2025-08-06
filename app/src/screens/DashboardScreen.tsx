import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Card, Text, useTheme, Surface, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setMode } from '../store/slices/appSlice';

export default function DashboardScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = React.useState(false);
  
  const { mode } = useSelector((state: RootState) => state.app);
  const production = useSelector((state: RootState) => state.production);
  const nextEvent = useSelector((state: RootState) => state.schedule.nextEvent);
  const activeEmergency = useSelector((state: RootState) => state.emergency.activeEmergency);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // 여기서 데이터 새로고침 로직 구현
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  // 현재 시간 표시
  const [currentTime, setCurrentTime] = React.useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatKoreanTime = (date: Date) => {
    const koreaTime = new Date(date.getTime() + (6 * 60 * 60 * 1000)); // UTC+9 (한국) - UTC+3 (사이프러스) = 6시간
    return koreaTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 헤더 정보 */}
        <Surface style={styles.header} elevation={1}>
          <View style={styles.headerContent}>
            <View>
              <Text variant="headlineSmall" style={styles.title}>
                WSOP Cyprus - Day 3
              </Text>
              <Text variant="bodyMedium" style={styles.time}>
                🕐 {formatTime(currentTime)} (KR {formatKoreanTime(currentTime)})
              </Text>
            </View>
            <Chip 
              mode="flat" 
              style={[
                styles.modeChip,
                mode === 'crisis' && { backgroundColor: theme.colors.error }
              ]}
            >
              {mode === 'normal' ? '일반' : mode === 'production' ? '촬영중' : '위기'}
            </Chip>
          </View>
        </Surface>

        {/* 긴급 알림 */}
        {activeEmergency && (
          <Card style={[styles.emergencyCard, { backgroundColor: theme.colors.error }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: 'white' }}>
                ⚠️ {activeEmergency.title}
              </Text>
              <Text variant="bodyMedium" style={{ color: 'white' }}>
                레벨: {activeEmergency.level.toUpperCase()}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* 실시간 현황 */}
        <Card style={styles.card}>
          <Card.Title title="📊 실시간 현황" />
          <Card.Content>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text variant="bodySmall" style={styles.statusLabel}>피처 테이블</Text>
                <Text variant="headlineSmall" style={styles.statusValue}>
                  {production.featureTables.active}/{production.featureTables.total}
                </Text>
                <Text variant="bodySmall" style={styles.statusSubtext}>
                  {production.featureTables.issues > 0 
                    ? `⚠️ ${production.featureTables.issues}개 이슈`
                    : '✅ 정상'}
                </Text>
              </View>
              
              <View style={styles.statusItem}>
                <Text variant="bodySmall" style={styles.statusLabel}>전송 속도</Text>
                <Text variant="headlineSmall" style={styles.statusValue}>
                  {production.dataTransfer.speed.toFixed(1)} GB/h
                </Text>
                <Text variant="bodySmall" style={[
                  styles.statusSubtext,
                  production.dataTransfer.status === 'error' && { color: theme.colors.error }
                ]}>
                  {production.dataTransfer.status === 'stable' ? '✅ 안정' 
                    : production.dataTransfer.status === 'slow' ? '⚠️ 느림' 
                    : '❌ 오류'}
                </Text>
              </View>
              
              <View style={styles.statusItem}>
                <Text variant="bodySmall" style={styles.statusLabel}>팀원 상태</Text>
                <Text variant="headlineSmall" style={styles.statusValue}>
                  {production.team.active}/{production.team.total}
                </Text>
                <Text variant="bodySmall" style={styles.statusSubtext}>
                  🟢 {production.team.active} 🟡 {production.team.onBreak} 🔴 {production.team.offline}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 다음 일정 */}
        {nextEvent && (
          <Card style={styles.card}>
            <Card.Title 
              title="⏱️ 다음 일정"
              subtitle={formatTime(new Date(nextEvent.time))}
            />
            <Card.Content>
              <Text variant="titleMedium">{nextEvent.title}</Text>
              {nextEvent.location && (
                <Text variant="bodyMedium" style={styles.location}>
                  📍 {nextEvent.location}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* 빠른 액션 */}
        <Card style={styles.card}>
          <Card.Title title="⚡ 빠른 실행" />
          <Card.Content>
            <View style={styles.actionGrid}>
              <IconButton
                icon="checkbox-marked-circle-outline"
                mode="contained"
                size={30}
                onPress={() => {/* 체크리스트로 이동 */}}
              />
              <IconButton
                icon="message-alert"
                mode="contained"
                size={30}
                onPress={() => {/* 긴급 보고 */}}
              />
              <IconButton
                icon="phone"
                mode="contained"
                size={30}
                onPress={() => {/* 비상 연락 */}}
              />
              <IconButton
                icon="alert-octagon"
                mode="contained"
                size={30}
                onPress={() => dispatch(setMode('crisis'))}
              />
            </View>
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 16,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
  time: {
    marginTop: 4,
  },
  modeChip: {
    height: 32,
  },
  emergencyCard: {
    margin: 16,
    marginTop: 8,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  statusLabel: {
    opacity: 0.7,
  },
  statusValue: {
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statusSubtext: {
    fontSize: 12,
  },
  location: {
    marginTop: 8,
    opacity: 0.8,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});