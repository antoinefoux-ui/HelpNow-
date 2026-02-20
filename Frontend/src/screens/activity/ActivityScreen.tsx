import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';

import { useAuth } from '../../contexts/AuthContext';
import { emergencyService } from '../../services/emergencyService';
import { EmergencyRequest } from '../../types';

// Safely format a date from either camelCase or snake_case fields
const formatDate = (item: any): string => {
  const raw = item.createdAt ?? item.created_at ?? null;
  if (!raw) return 'Unknown date';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 'Unknown date';
  return format(d, 'MMM dd, yyyy • HH:mm');
};

// Resolve field values that may be camelCase or snake_case from the DB
const getField = (item: any, ...keys: string[]): any => {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key];
  }
  return null;
};

const ActivityScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [history, setHistory] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'seeker' | 'helper'>('all');

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await emergencyService.getUserHistory(user.id);

      // Filter based on selection — support both camelCase and snake_case IDs
      let filtered = data;
      if (filter === 'seeker') {
        filtered = data.filter(r =>
          getField(r, 'seekerId', 'seeker_id', 'user_id') === user.id
        );
      } else if (filter === 'helper') {
        filtered = data.filter(r =>
          getField(r, 'acceptedHelperId', 'accepted_helper_id', 'helper_id') === user.id
        );
      }

      setHistory(filtered);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'expired':
        return '#6B7280';
      default:
        return '#F59E0B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'check-circle';
      case 'cancelled':
        return 'close-circle';
      case 'expired':
        return 'clock-alert';
      default:
        return 'clock-outline';
    }
  };

  const renderEmergencyItem = ({ item }: { item: EmergencyRequest }) => {
    const seekerId = getField(item, 'seekerId', 'seeker_id', 'user_id');
    const isSeeker = seekerId === user?.id;

    // Support both camelCase and snake_case for all fields
    const itemType: string = getField(item, 'type', 'category') ?? 'other';
    const address: string | null = getField(item, 'address') ?? null;
    const description: string | null = getField(item, 'description') ?? null;
    const rating: number | null = getField(item, 'rating') ?? null;
    const acceptedHelperInfo = getField(item, 'acceptedHelperInfo', 'accepted_helper_info');
    const seekerInfo = getField(item, 'seekerInfo', 'seeker_info');
    const itemId: string = getField(item, 'id') ?? Math.random().toString();

    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Icon
              name={itemType === 'heart_attack' ? 'heart-pulse' : 'alert'}
              size={20}
              color={getStatusColor(item.status)}
            />
            <Text style={[styles.typeText, { color: getStatusColor(item.status) }]}>
              {itemType.replace(/_/g, ' ')}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Icon name={getStatusIcon(item.status)} size={16} color="#FFFFFF" />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Icon name="clock-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {formatDate(item)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="map-marker" size={16} color="#6B7280" />
            <Text style={styles.infoText} numberOfLines={1}>
              {address || 'Unknown location'}
            </Text>
          </View>

          {isSeeker && acceptedHelperInfo && (
            <View style={styles.helperInfo}>
              <Icon name="account-heart" size={16} color="#10B981" />
              <Text style={styles.helperName}>
                Helped by {acceptedHelperInfo.name}
              </Text>
              {rating && (
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{rating}</Text>
                </View>
              )}
            </View>
          )}

          {!isSeeker && seekerInfo && (
            <View style={styles.seekerInfo}>
              <Icon name="account-alert" size={16} color="#E53E3E" />
              <Text style={styles.seekerName}>
                Helped {seekerInfo.name}
              </Text>
            </View>
          )}
        </View>

        {description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description} numberOfLines={2}>
              "{description}"
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="history" size={64} color="#CBD5E0" />
      <Text style={styles.emptyTitle}>{t('activity.noActivity')}</Text>
      <Text style={styles.emptyText}>
        Your emergency requests and responses will appear here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('activity.title')}</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'seeker' && styles.filterTabActive]}
          onPress={() => setFilter('seeker')}
        >
          <Text style={[styles.filterText, filter === 'seeker' && styles.filterTextActive]}>
            My Requests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'helper' && styles.filterTabActive]}
          onPress={() => setFilter('helper')}
        >
          <Text style={[styles.filterText, filter === 'helper' && styles.filterTextActive]}>
            Helped Others
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={history}
        renderItem={renderEmergencyItem}
        keyExtractor={(item) => getField(item, 'id')?.toString() ?? Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#E53E3E',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  helperInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  helperName: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  seekerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  seekerName: {
    fontSize: 14,
    color: '#E53E3E',
    fontWeight: '600',
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 4,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  description: {
    fontSize: 13,
    color: '#4A5568',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 250,
  },
});

export default ActivityScreen;
