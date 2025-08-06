import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { 
  Card, 
  Text, 
  IconButton, 
  useTheme,
  List,
  Divider,
  Chip,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface QuickContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  type: 'emergency' | 'team' | 'external';
}

interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
}

const QUICK_CONTACTS: QuickContact[] = [
  { id: '1', name: '본사 총괄 디렉터', role: '총괄', phone: '+82-10-1234-5678', type: 'emergency' },
  { id: '2', name: '외주 PM', role: 'PM', phone: '+82-10-2345-6789', type: 'emergency' },
  { id: '3', name: '메리트 호텔 매니저', role: '베뉴', phone: '+357-99-123456', type: 'external' },
  { id: '4', name: '기술팀장', role: '기술', phone: '+82-10-3456-7890', type: 'team' },
];

const MESSAGE_TEMPLATES: Template[] = [
  { id: '1', name: '일일 보고', category: 'daily', content: '[WSOP Cyprus] D+{일차} 일일 보고서...' },
  { id: '2', name: '긴급 상황', category: 'emergency', content: '[긴급] {상황 요약}...' },
  { id: '3', name: '업무 요청', category: 'request', content: 'To: {수신자}\nRe: {요청 제목}...' },
];

export default function CommunicationScreen() {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [messageContent, setMessageContent] = useState('');

  const handleCall = (phone: string) => {
    // 실제 전화 걸기 로직
    console.log('Calling:', phone);
  };

  const handleMessage = (template: Template) => {
    setSelectedTemplate(template);
    setMessageContent(template.content);
    setModalVisible(true);
  };

  const sendMessage = () => {
    // 메시지 전송 로직
    console.log('Sending message:', messageContent);
    setModalVisible(false);
    setMessageContent('');
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return theme.colors.error;
      case 'team': return theme.colors.primary;
      case 'external': return theme.colors.tertiary;
      default: return theme.colors.onSurface;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 빠른 연락처 */}
        <Card style={styles.card}>
          <Card.Title title="📞 빠른 연락처" />
          <Card.Content>
            {QUICK_CONTACTS.map((contact) => (
              <List.Item
                key={contact.id}
                title={contact.name}
                description={contact.role}
                left={() => (
                  <List.Icon 
                    icon="account-circle" 
                    color={getContactTypeColor(contact.type)}
                  />
                )}
                right={() => (
                  <View style={styles.contactActions}>
                    <IconButton
                      icon="phone"
                      mode="contained-tonal"
                      size={20}
                      onPress={() => handleCall(contact.phone)}
                    />
                    <IconButton
                      icon="message"
                      mode="contained-tonal"
                      size={20}
                      onPress={() => {}}
                    />
                  </View>
                )}
              />
            ))}
          </Card.Content>
        </Card>

        {/* 메시지 템플릿 */}
        <Card style={styles.card}>
          <Card.Title title="📝 빠른 메시지" />
          <Card.Content>
            {MESSAGE_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                onPress={() => handleMessage(template)}
              >
                <List.Item
                  title={template.name}
                  description={template.category}
                  right={() => (
                    <Chip mode="flat" compact>
                      {template.category === 'daily' ? '일일' : 
                       template.category === 'emergency' ? '긴급' : '요청'}
                    </Chip>
                  )}
                  style={styles.templateItem}
                />
                <Divider />
              </TouchableOpacity>
            ))}
          </Card.Content>
        </Card>

        {/* 최근 통신 내역 */}
        <Card style={styles.card}>
          <Card.Title title="🕐 최근 통신 내역" />
          <Card.Content>
            <List.Item
              title="본사 일일 보고 전송"
              description="10분 전"
              left={() => <List.Icon icon="check-circle" color={theme.colors.success} />}
            />
            <List.Item
              title="기술팀장 통화"
              description="1시간 전"
              left={() => <List.Icon icon="phone-outgoing" />}
            />
            <List.Item
              title="긴급 상황 보고"
              description="3시간 전"
              left={() => <List.Icon icon="alert-circle" color={theme.colors.warning} />}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* 메시지 작성 모달 */}
      <Portal>
        <Modal 
          visible={modalVisible} 
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {selectedTemplate?.name}
          </Text>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={10}
            value={messageContent}
            onChangeText={setMessageContent}
            style={styles.textInput}
          />
          <View style={styles.modalActions}>
            <Button mode="text" onPress={() => setModalVisible(false)}>
              취소
            </Button>
            <Button mode="contained" onPress={sendMessage}>
              전송
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* FAB 메뉴 */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {/* 새 메시지 작성 */}}
      />
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
  contactActions: {
    flexDirection: 'row',
  },
  templateItem: {
    paddingVertical: 12,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});