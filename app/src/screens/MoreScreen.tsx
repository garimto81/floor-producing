import React from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { 
  Card, 
  List, 
  Switch, 
  useTheme,
  Divider,
  Text,
  Button
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setMode } from '../store/slices/appSlice';

export default function MoreScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { mode } = useSelector((state: RootState) => state.app);
  
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [autoSync, setAutoSync] = React.useState(true);

  const handleEmergencyMode = () => {
    Alert.alert(
      '위기 모드 전환',
      '위기 모드로 전환하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '전환', 
          style: 'destructive',
          onPress: () => dispatch(setMode('crisis'))
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('데이터 내보내기', '모든 데이터를 내보내시겠습니까?');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 설정 */}
        <Card style={styles.card}>
          <Card.Title title="⚙️ 설정" />
          <Card.Content>
            <List.Item
              title="다크 모드"
              description="어두운 환경에서 사용"
              left={() => <List.Icon icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                />
              )}
            />
            <Divider />
            <List.Item
              title="알림"
              description="푸시 알림 받기"
              left={() => <List.Icon icon="bell" />}
              right={() => (
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                />
              )}
            />
            <Divider />
            <List.Item
              title="자동 동기화"
              description="데이터 자동 백업"
              left={() => <List.Icon icon="sync" />}
              right={() => (
                <Switch
                  value={autoSync}
                  onValueChange={setAutoSync}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* 운영 모드 */}
        <Card style={styles.card}>
          <Card.Title title="🎬 운영 모드" />
          <Card.Content>
            <View style={styles.modeButtons}>
              <Button 
                mode={mode === 'normal' ? 'contained' : 'outlined'}
                onPress={() => dispatch(setMode('normal'))}
                style={styles.modeButton}
              >
                일반
              </Button>
              <Button 
                mode={mode === 'production' ? 'contained' : 'outlined'}
                onPress={() => dispatch(setMode('production'))}
                style={styles.modeButton}
              >
                촬영중
              </Button>
              <Button 
                mode={mode === 'crisis' ? 'contained' : 'outlined'}
                onPress={handleEmergencyMode}
                style={styles.modeButton}
                buttonColor={theme.colors.error}
              >
                위기
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* 데이터 관리 */}
        <Card style={styles.card}>
          <Card.Title title="💾 데이터 관리" />
          <Card.Content>
            <List.Item
              title="데이터 내보내기"
              description="모든 데이터를 파일로 저장"
              left={() => <List.Icon icon="export" />}
              onPress={handleExportData}
            />
            <Divider />
            <List.Item
              title="캐시 정리"
              description="임시 파일 삭제"
              left={() => <List.Icon icon="broom" />}
              onPress={() => Alert.alert('캐시 정리', '캐시를 정리하시겠습니까?')}
            />
          </Card.Content>
        </Card>

        {/* 도움말 */}
        <Card style={styles.card}>
          <Card.Title title="❓ 도움말" />
          <Card.Content>
            <List.Item
              title="사용 가이드"
              description="앱 사용 방법"
              left={() => <List.Icon icon="book-open-variant" />}
              onPress={() => {}}
            />
            <Divider />
            <List.Item
              title="비상 연락처"
              description="긴급 상황 연락처 목록"
              left={() => <List.Icon icon="phone-alert" />}
              onPress={() => {}}
            />
            <Divider />
            <List.Item
              title="버전 정보"
              description="v1.0.0"
              left={() => <List.Icon icon="information" />}
            />
          </Card.Content>
        </Card>

        {/* 계정 */}
        <Card style={styles.card}>
          <Card.Title title="👤 계정" />
          <Card.Content>
            <List.Item
              title="현장 총괄"
              description="권한: 전체 관리자"
              left={() => <List.Icon icon="account-circle" />}
            />
            <Divider />
            <List.Item
              title="로그아웃"
              description="계정에서 로그아웃"
              left={() => <List.Icon icon="logout" color={theme.colors.error} />}
              onPress={() => Alert.alert('로그아웃', '로그아웃 하시겠습니까?')}
            />
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
  card: {
    margin: 16,
    marginBottom: 8,
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modeButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});