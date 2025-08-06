import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { 
  Card, 
  List, 
  Checkbox, 
  Text, 
  Chip, 
  SegmentedButtons,
  FAB,
  ProgressBar,
  useTheme 
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { 
  toggleChecklistItem, 
  setActiveCategory,
  setChecklistItems 
} from '../store/slices/checklistSlice';
import { ChecklistItem } from '../types';

// 더미 체크리스트 데이터
const DUMMY_CHECKLISTS: ChecklistItem[] = [
  // 아침 체크리스트
  { id: '1', title: '모든 카메라 전원 및 신호 확인', category: 'morning', priority: 'high', completed: false },
  { id: '2', title: '오디오 레벨 테스트', category: 'morning', priority: 'high', completed: false },
  { id: '3', title: '스위처 입출력 신호 확인', category: 'morning', priority: 'high', completed: false },
  { id: '4', title: '본사 전송 네트워크 속도 테스트', category: 'morning', priority: 'medium', completed: false },
  { id: '5', title: '전 스태프 출근 확인', category: 'morning', priority: 'medium', completed: false },
  
  // 촬영 중 체크리스트
  { id: '6', title: '피처 테이블 영상 품질 체크', category: 'production', priority: 'high', completed: false },
  { id: '7', title: '오디오 레벨 일관성 확인', category: 'production', priority: 'high', completed: false },
  { id: '8', title: '데이터 전송 속도 모니터링', category: 'production', priority: 'high', completed: false },
  { id: '9', title: '예정된 인터뷰 진행 상황', category: 'production', priority: 'medium', completed: false },
  { id: '10', title: '본사 요청사항 처리', category: 'production', priority: 'medium', completed: false },
  
  // 저녁 체크리스트
  { id: '11', title: '모든 촬영 데이터 1차 백업', category: 'evening', priority: 'high', completed: false },
  { id: '12', title: '본사 전송 파일 리스트 확인', category: 'evening', priority: 'high', completed: false },
  { id: '13', title: '모든 배터리 충전 시작', category: 'evening', priority: 'medium', completed: false },
  { id: '14', title: '일일 촬영 로그 작성', category: 'evening', priority: 'medium', completed: false },
  { id: '15', title: '본사 일일 보고서 전송', category: 'evening', priority: 'high', completed: false },
];

export default function ChecklistScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  const { items, activeCategory } = useSelector((state: RootState) => state.checklist);

  useEffect(() => {
    // 초기 데이터 로드
    dispatch(setChecklistItems(DUMMY_CHECKLISTS));
  }, [dispatch]);

  // 카테고리별 필터링
  const filteredItems = items.filter(item => item.category === activeCategory);
  
  // 완료율 계산
  const completionRate = filteredItems.length > 0
    ? (filteredItems.filter(item => item.completed).length / filteredItems.length) * 100
    : 0;

  const handleToggle = (id: string) => {
    dispatch(toggleChecklistItem(id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.info;
      default: return theme.colors.onSurface;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'morning': return '아침 준비';
      case 'production': return '촬영 중';
      case 'evening': return '일일 마감';
      case 'emergency': return '긴급';
      default: return category;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={activeCategory}
          onValueChange={(value) => dispatch(setActiveCategory(value as any))}
          buttons={[
            { value: 'morning', label: '아침' },
            { value: 'production', label: '촬영' },
            { value: 'evening', label: '마감' },
          ]}
          style={styles.segmentedButtons}
        />
        
        <Card style={styles.progressCard}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <Text variant="bodyMedium">완료율</Text>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {completionRate.toFixed(0)}%
              </Text>
            </View>
            <ProgressBar 
              progress={completionRate / 100} 
              color={completionRate === 100 ? theme.colors.success : theme.colors.primary}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>
      </View>

      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Title 
            title={getCategoryLabel(activeCategory)}
            subtitle={`${filteredItems.filter(item => item.completed).length}/${filteredItems.length} 완료`}
          />
          <Card.Content>
            <List.Section>
              {filteredItems.map((item) => (
                <List.Item
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  onPress={() => handleToggle(item.id)}
                  left={() => (
                    <Checkbox
                      status={item.completed ? 'checked' : 'unchecked'}
                      onPress={() => handleToggle(item.id)}
                    />
                  )}
                  right={() => (
                    <Chip 
                      mode="flat" 
                      compact
                      style={{ 
                        backgroundColor: getPriorityColor(item.priority) + '20',
                      }}
                      textStyle={{ 
                        color: getPriorityColor(item.priority),
                        fontSize: 11,
                      }}
                    >
                      {item.priority === 'high' ? '높음' : item.priority === 'medium' ? '중간' : '낮음'}
                    </Chip>
                  )}
                  style={[
                    styles.listItem,
                    item.completed && styles.completedItem
                  ]}
                />
              ))}
            </List.Section>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={() => {
          // 체크리스트 리셋 로직
          dispatch(setChecklistItems(
            DUMMY_CHECKLISTS.map(item => ({ ...item, completed: false }))
          ));
        }}
      />
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
  segmentedButtons: {
    marginBottom: 16,
  },
  progressCard: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  listItem: {
    paddingVertical: 8,
  },
  completedItem: {
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});