import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  FlatList,
  TextInput,
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

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline';
  balance: number;
  lastActivity: string;
}

interface PendingRequest {
  id: string;
  name: string;
  email: string;
  avatar: string;
  type: 'sent' | 'received';
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', avatar: 'A', status: 'online', balance: 25.50, lastActivity: '2 hours ago' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', avatar: 'B', status: 'offline', balance: -15.75, lastActivity: '1 day ago' },
    { id: '3', name: 'Carol Davis', email: 'carol@example.com', avatar: 'C', status: 'online', balance: 0, lastActivity: '3 hours ago' },
    { id: '4', name: 'David Wilson', email: 'david@example.com', avatar: 'D', status: 'offline', balance: 42.20, lastActivity: '2 days ago' },
  ]);

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([
    { id: '1', name: 'Emma Brown', email: 'emma@example.com', avatar: 'E', type: 'received' },
    { id: '2', name: 'Frank Miller', email: 'frank@example.com', avatar: 'F', type: 'sent' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  // Animation values
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const searchBarOpacity = useSharedValue(0);
  const tabsOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Start animations
    headerOpacity.value = withDelay(200, withSpring(1));
    searchBarOpacity.value = withDelay(400, withSpring(1));
    tabsOpacity.value = withDelay(600, withSpring(1));
    contentOpacity.value = withDelay(800, withSpring(1));
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 100], [0, -20]),
      },
    ],
  }));

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchBarOpacity.value,
    transform: [{ translateY: interpolate(searchBarOpacity.value, [0, 1], [30, 0]) }],
  }));

  const tabsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tabsOpacity.value,
    transform: [{ translateY: interpolate(tabsOpacity.value, [0, 1], [30, 0]) }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: interpolate(contentOpacity.value, [0, 1], [50, 0]) }],
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const renderFriend = ({ item }: { item: Friend }) => (
    <Pressable style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{item.avatar}</Text>
          </LinearGradient>
          <View style={[styles.statusIndicator, { backgroundColor: item.status === 'online' ? '#4CAF50' : '#ccc' }]} />
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
          <Text style={styles.lastActivity}>Last seen {item.lastActivity}</Text>
        </View>
      </View>
      <View style={styles.friendActions}>
        {item.balance !== 0 && (
          <View style={[styles.balanceChip, { backgroundColor: item.balance > 0 ? '#E8F5E8' : '#FFE8E8' }]}>
            <Text style={[styles.balanceText, { color: item.balance > 0 ? '#4CAF50' : '#ff4757' }]}>
              {item.balance > 0 ? '+' : ''}${Math.abs(item.balance).toFixed(2)}
            </Text>
          </View>
        )}
        <Pressable style={styles.actionButton}>
          <Ionicons name="chatbubble" size={20} color="#667eea" />
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </Pressable>
      </View>
    </Pressable>
  );

  const renderPendingRequest = ({ item }: { item: PendingRequest }) => (
    <Pressable style={styles.requestItem}>
      <View style={styles.friendInfo}>
        <LinearGradient
          colors={['#FF9800', '#FF5722']}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </LinearGradient>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
          <Text style={styles.requestType}>
            {item.type === 'received' ? 'Wants to be friends' : 'Request sent'}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        {item.type === 'received' ? (
          <>
            <Pressable style={[styles.requestButton, styles.acceptButton]}>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            </Pressable>
            <Pressable style={[styles.requestButton, styles.declineButton]}>
              <Ionicons name="close" size={16} color="#ffffff" />
            </Pressable>
          </>
        ) : (
          <Pressable style={[styles.requestButton, styles.cancelButton]}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Text style={styles.headerTitle}>Friends</Text>
          <Pressable style={styles.addButton}>
            <Ionicons name="person-add" size={24} color="#ffffff" />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.searchContainer, searchBarAnimatedStyle]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.tabsContainer, tabsAnimatedStyle]}>
          <Pressable
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends ({friends.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Requests ({pendingRequests.length})
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
          {activeTab === 'friends' ? (
            <View style={styles.friendsContainer}>
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend) => (
                  <View key={friend.id}>
                    {renderFriend({ item: friend })}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people" size={64} color="#ccc" />
                  <Text style={styles.emptyStateTitle}>No friends found</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    {searchQuery ? 'Try a different search term' : 'Add some friends to get started'}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.requestsContainer}>
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <View key={request.id}>
                    {renderPendingRequest({ item: request })}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="mail" size={64} color="#ccc" />
                  <Text style={styles.emptyStateTitle}>No pending requests</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    All caught up! No friend requests at the moment.
                  </Text>
                </View>
              )}
            </View>
          )}
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#667eea',
  },
  contentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
    marginBottom: 40,
    minHeight: 400,
  },
  friendsContainer: {
    gap: 15,
  },
  requestsContainer: {
    gap: 15,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lastActivity: {
    fontSize: 12,
    color: '#999',
  },
  requestType: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  balanceChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#ff4757',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    width: 'auto',
  },
  cancelButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
