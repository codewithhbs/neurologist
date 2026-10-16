import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen({ children, scroll = true, className = '' }) {
  const Wrapper = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white" edges={['top']}>
      <Wrapper
        className={`flex-1 bg-white ${className}`}
        contentContainerStyle={scroll ? { flexGrow: 1 } : undefined}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}
