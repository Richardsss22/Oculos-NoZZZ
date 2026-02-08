// src/screens/HistoryScreen.tsx

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore, getTheme } from '../styles/theme';
import { useI18nStore } from '../i18n/i18nStore';
import { useTripHistoryStore } from '../services/TripHistoryStore';

export default function HistoryScreen({ navigation }: any) {
  const { isDarkMode } = useThemeStore();
  const colors = getTheme(isDarkMode);
  const { t, language } = useI18nStore();

  const trips = useTripHistoryStore((state) => state.trips);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const tripsThisMonth = useMemo(
    () =>
      trips.filter((trip) => {
        const d = new Date(trip.startTime);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }),
    [trips, currentMonth, currentYear]
  );

  const statsAllTime = useMemo(() => {
    if (!trips.length) {
      return {
        totalKm: 0,
        totalDurationMin: 0,
        totalAlarms: 0,
        totalTrips: 0,
      };
    }

    let totalKm = 0;
    let totalDurationMs = 0;
    let totalAlarms = 0;

    trips.forEach((trip) => {
      totalKm += trip.distanceKm;
      totalAlarms += trip.alarmCount;
      const start = new Date(trip.startTime).getTime();
      const end = new Date(trip.endTime).getTime();
      totalDurationMs += Math.max(0, end - start);
    });

    return {
      totalKm,
      totalDurationMin: Math.round(totalDurationMs / 1000 / 60),
      totalAlarms,
      totalTrips: trips.length,
    };
  }, [trips]);

  const statsThisMonth = useMemo(() => {
    if (!tripsThisMonth.length) {
      return {
        totalKm: 0,
        totalDurationMin: 0,
        totalAlarms: 0,
        totalTrips: 0,
      };
    }

    let totalKm = 0;
    let totalDurationMs = 0;
    let totalAlarms = 0;

    tripsThisMonth.forEach((trip) => {
      totalKm += trip.distanceKm;
      totalAlarms += trip.alarmCount;
      const start = new Date(trip.startTime).getTime();
      const end = new Date(trip.endTime).getTime();
      totalDurationMs += Math.max(0, end - start);
    });

    return {
      totalKm,
      totalDurationMin: Math.round(totalDurationMs / 1000 / 60),
      totalAlarms,
      totalTrips: tripsThisMonth.length,
    };
  }, [tripsThisMonth]);

  const maxAlarms =
    trips.length > 0 ? Math.max(...trips.map((t) => t.alarmCount)) || 1 : 1;

  const formatDuration = (startIso: string, endIso: string) => {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const ms = Math.max(0, end - start);
    const totalSec = Math.round(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);

    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
    return `${m} min`;
  };

  const formatTimeRange = (startIso: string, endIso: string) => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const fmt = (d: Date) =>
      `${d.getHours().toString().padStart(2, '0')}:${d
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
    return `${fmt(start)} – ${fmt(end)}`;
  };

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso);
    const hoje = new Date();
    const baseHoje = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate()
    ).getTime();
    const baseDia = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    ).getTime();

    const diffMs = baseHoje - baseDia;
    const diffDias = diffMs / (1000 * 60 * 60 * 24);

    if (diffDias === 0) return language === 'pt' ? 'Hoje' : 'Today';
    if (diffDias === 1) return language === 'pt' ? 'Ontem' : 'Yesterday';

    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
  };

  const monthLabel =
    language === 'pt'
      ? now.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
      : now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {language === 'pt' ? 'Histórico de Viagens' : 'Trip History'}
          </Text>
          <Text style={[styles.subTitle, { color: colors.inactive }]}>
            {language === 'pt'
              ? `Resumo de ${monthLabel}`
              : `This month · ${monthLabel}`}
          </Text>
        </View>

        {/* RESUMO ESTE MÊS */}
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: colors.inactive }]}>
              {language === 'pt'
                ? 'Distância este mês'
                : 'Distance this month'}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {statsThisMonth.totalKm.toFixed(1)} km
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: colors.inactive }]}>
              {language === 'pt'
                ? 'Tempo a conduzir'
                : 'Driving time this month'}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {statsThisMonth.totalDurationMin} min
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: colors.inactive }]}>
              {language === 'pt'
                ? 'Alarmes este mês'
                : 'Alarms this month'}
            </Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    statsThisMonth.totalAlarms > 0 ? '#FF5252' : colors.text,
                },
              ]}
            >
              {statsThisMonth.totalAlarms}
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: colors.inactive }]}>
              {language === 'pt'
                ? 'Viagens este mês'
                : 'Trips this month'}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {statsThisMonth.totalTrips}
            </Text>
          </View>
        </View>

        {/* "Gráfico" de alarmes por viagem */}
        {trips.length > 0 && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              {language === 'pt'
                ? 'Alarmes por viagem'
                : 'Alarms per trip'}
            </Text>

            {trips.map((trip, index) => {
              const ratio =
                maxAlarms === 0 ? 0 : trip.alarmCount / maxAlarms;
              const barWidthPercent = Math.max(ratio * 100, 8);

              return (
                <View key={trip.id} style={styles.barRow}>
                  <View style={styles.barLabelCol}>
                    <Text
                      style={[
                        styles.barTripIndex,
                        { color: colors.inactive },
                      ]}
                    >
                      #{trips.length - index}
                    </Text>
                    <Text
                      style={[
                        styles.barDate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatDateLabel(trip.startTime)}
                    </Text>
                  </View>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.barBackground,
                        { backgroundColor: colors.inputBg },
                      ]}
                    />
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${barWidthPercent}%`,
                          backgroundColor:
                            trip.alarmCount > 0 ? '#FF5252' : '#4CAF50',
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barValue,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {trip.alarmCount}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Lista de viagens */}
        <View>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textSecondary, marginBottom: 8 },
            ]}
          >
            {language === 'pt' ? 'Viagens recentes' : 'Recent trips'}
          </Text>

          {trips.length === 0 && (
            <View
              style={[
                styles.emptyState,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                {language === 'pt'
                  ? 'Ainda não há viagens registadas.'
                  : 'No trips recorded yet.'}
              </Text>
            </View>
          )}

          {trips.map((trip) => {
            const dateLabel = formatDateLabel(trip.startTime);
            const timeRange = formatTimeRange(
              trip.startTime,
              trip.endTime
            );
            const durationLabel = formatDuration(
              trip.startTime,
              trip.endTime
            );

            return (
              <View
                key={trip.id}
                style={[
                  styles.tripCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.tripHeaderRow}>
                  <Text
                    style={[
                      styles.tripDate,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {dateLabel}
                  </Text>
                  <Text
                    style={[
                      styles.tripTimeRange,
                      { color: colors.inactive },
                    ]}
                  >
                    {timeRange}
                  </Text>
                </View>

                <View style={styles.tripStatsRow}>
                  <View style={styles.tripStatItem}>
                    <Text
                      style={[
                        styles.tripStatLabel,
                        { color: colors.inactive },
                      ]}
                    >
                      {language === 'pt' ? 'Distância' : 'Distance'}
                    </Text>
                    <Text
                      style={[
                        styles.tripStatValue,
                        { color: colors.text },
                      ]}
                    >
                      {trip.distanceKm.toFixed(1)} km
                    </Text>
                  </View>
                  <View style={styles.tripStatItem}>
                    <Text
                      style={[
                        styles.tripStatLabel,
                        { color: colors.inactive },
                      ]}
                    >
                      {language === 'pt' ? 'Duração' : 'Duration'}
                    </Text>
                    <Text
                      style={[
                        styles.tripStatValue,
                        { color: colors.text },
                      ]}
                    >
                      {durationLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.tripStatsRow}>
                  <View style={styles.tripStatItem}>
                    <Text
                      style={[
                        styles.tripStatLabel,
                        { color: colors.inactive },
                      ]}
                    >
                      {language === 'pt' ? 'Vel. média' : 'Avg speed'}
                    </Text>
                    <Text
                      style={[
                        styles.tripStatValue,
                        { color: colors.text },
                      ]}
                    >
                      {Math.round(trip.avgSpeedKmh)} km/h
                    </Text>
                  </View>
                  <View style={styles.tripStatItem}>
                    <Text
                      style={[
                        styles.tripStatLabel,
                        { color: colors.inactive },
                      ]}
                    >
                      {language === 'pt' ? 'Vel. máx.' : 'Max speed'}
                    </Text>
                    <Text
                      style={[
                        styles.tripStatValue,
                        { color: colors.text },
                      ]}
                    >
                      {Math.round(trip.maxSpeedKmh)} km/h
                    </Text>
                  </View>
                </View>

                <View style={styles.tripFooterRow}>
                  <View
                    style={[
                      styles.alarmBadge,
                      {
                        backgroundColor:
                          trip.alarmCount > 0 ? '#FFEBEE' : '#E8F5E9',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: trip.alarmCount > 0 ? '#C62828' : '#2E7D32',
                        fontWeight: '600',
                      }}
                    >
                      {trip.alarmCount === 0
                        ? language === 'pt'
                          ? 'Sem alarmes 🎉'
                          : 'No alarms 🎉'
                        : language === 'pt'
                        ? `${trip.alarmCount} alarmes de sonolência`
                        : `${trip.alarmCount} drowsiness alarms`}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* RESUMO GLOBAL (desde sempre) */}
        <View style={{ marginTop: 24 }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textSecondary, marginBottom: 8 },
            ]}
          >
            {language === 'pt'
              ? 'Resumo global (desde sempre)'
              : 'Global summary (all time)'}
          </Text>

          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.summaryLabel, { color: colors.inactive }]}
              >
                {language === 'pt' ? 'Distância total' : 'Total distance'}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {statsAllTime.totalKm.toFixed(1)} km
              </Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.summaryLabel, { color: colors.inactive }]}
              >
                {language === 'pt'
                  ? 'Tempo total a conduzir'
                  : 'Total driving time'}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {statsAllTime.totalDurationMin} min
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.summaryLabel, { color: colors.inactive }]}
              >
                {language === 'pt'
                  ? 'Alarmes de sonolência'
                  : 'Drowsiness alarms'}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color:
                      statsAllTime.totalAlarms > 0 ? '#FF5252' : colors.text,
                  },
                ]}
              >
                {statsAllTime.totalAlarms}
              </Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.summaryLabel, { color: colors.inactive }]}
              >
                {language === 'pt'
                  ? 'Número de viagens'
                  : 'Number of trips'}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {statsAllTime.totalTrips}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subTitle: {
    fontSize: 13,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  barLabelCol: {
    width: 70,
  },
  barTripIndex: {
    fontSize: 12,
    fontWeight: '600',
  },
  barDate: {
    fontSize: 11,
  },
  barContainer: {
    flex: 1,
    height: 18,
    position: 'relative',
    justifyContent: 'center',
  },
  barBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 999,
    opacity: 0.4,
  },
  barFill: {
    height: 12,
    borderRadius: 999,
  },
  barValue: {
    width: 24,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },
  tripCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tripDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  tripTimeRange: {
    fontSize: 12,
  },
  tripStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tripStatItem: {
    flex: 1,
  },
  tripStatLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  tripStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tripFooterRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alarmBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
