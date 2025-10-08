import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  icon: string;
  color: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export default function HomeScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', title: 'Starbucks Coffee', amount: 5.50, category: 'Food', date: 'Today', icon: 'cafe', color: '#FF9800' },
    { id: '2', title: 'Uber Ride', amount: 12.30, category: 'Transport', date: 'Today', icon: 'car', color: '#2196F3' },
    { id: '3', title: 'Netflix Subscription', amount: 15.99, category: 'Entertainment', date: 'Yesterday', icon: 'play', color: '#E91E63' },
    { id: '4', title: 'Grocery Shopping', amount: 78.45, category: 'Shopping', date: 'Yesterday', icon: 'bag', color: '#4CAF50' },
  ]);

  // Animation values
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const quickActionsOpacity = useSharedValue(0);
  const expensesOpacity = useSharedValue(0);

  useEffect(() => {
    // Start animations
    headerOpacity.value = withDelay(200, withSpring(1));
    cardScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 200 }));
    quickActionsOpacity.value = withDelay(600, withSpring(1));
    expensesOpacity.value = withDelay(800, withSpring(1));
  }, []);

  const quickActions: QuickAction[] = [
    { id: '1', title: 'Add Expense', icon: 'add-circle', color: '#667eea', onPress: () => console.log('Add Expense') },
    { id: '2', title: 'Split Bill', icon: 'people', color: '#FF9800', onPress: () => console.log('Split Bill') },
    { id: '3', title: 'Budget', icon: 'pie-chart', color: '#4CAF50', onPress: () => console.log('Budget') },
    { id: '4', title: 'Reports', icon: 'analytics', color: '#E91E63', onPress: () => console.log('Reports') },
  ];

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 100], [0, -20]),
      },
    ],
  }));

  const balanceCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      {
        translateY: interpolate(scrollY.value, [0, 200], [0, -50]),
      },
    ],
  }));

  const quickActionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: quickActionsOpacity.value,
    transform: [{ translateY: interpolate(quickActionsOpacity.value, [0, 1], [30, 0]) }],
  }));

  const expensesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: expensesOpacity.value,
    transform: [{ translateY: interpolate(expensesOpacity.value, [0, 1], [50, 0]) }],
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const renderExpenseItem = ({ item, index }: { item: Expense; index: number }) => (
    <View style={styles.expenseItem}>
      <View style={[styles.expenseIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={20} color="#ffffff" />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <Text style={styles.expenseCategory}>{item.category} • {item.date}</Text>
      </View>
      <Text style={styles.expenseAmount}>-${item.amount.toFixed(2)}</Text>
    </View>
  );

  const renderQuickAction = ({ item }: { item: QuickAction }) => (
    <Pressable style={styles.quickActionItem} onPress={item.onPress}>
      <LinearGradient
        colors={[item.color, item.color + '80']}
        style={styles.quickActionGradient}
      >
        <Ionicons name={item.icon as any} size={24} color="#ffffff" />
      </LinearGradient>
      <Text style={styles.quickActionText}>{item.title}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
      
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.userName}>John Doe</Text>
          </View>
          <Pressable style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#ffffff" />
            <View style={styles.notificationBadge} />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.balanceCard, balanceCardAnimatedStyle]}>
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.cardGradient}
          >
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>$2,847.50</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceSubLabel}>Income</Text>
                <Text style={[styles.balanceSubAmount, { color: '#4CAF50' }]}>+$3,200</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceSubLabel}>Expenses</Text>
                <Text style={[styles.balanceSubAmount, { color: '#ff4757' }]}>-$352.50</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.quickActionsContainer, quickActionsAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <FlatList
            data={quickActions}
            renderItem={renderQuickAction}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsList}
          />
        </Animated.View>

        <Animated.View style={[styles.expensesContainer, expensesAnimatedStyle]}>
          <View style={styles.expensesHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <Pressable>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>
          <View style={styles.expensesList}>
            {expenses.map((item, index) => (
              <View key={item.id}>
                {renderExpenseItem({ item, index })}
              </View>
            ))}
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
  },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 25,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
  },
  cardGradient: {
    borderRadius: 25,
    padding: 25,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
  },
  balanceSubLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  balanceSubAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  quickActionsList: {
    paddingHorizontal: 20,
  },
  quickActionItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  quickActionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
  expensesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 15,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  seeAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  expensesList: {
    gap: 15,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#666666',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4757',
  },
});