import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle as SvgCircle, G } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { fetchFinalizedCases, fetchUsers } from '../../api/adminApi';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE } from 'utils/constants';
import AdminSidebarToggle from '../../components/navigation/AdminSidebarToggle';

const ROLE_COLORS = {
  intern: { primary: '#228BE6', light: '#E7F5FF' },
  lawyer: { primary: '#12B886', light: '#E6FCF5' },
  director: { primary: '#9C36B5', light: '#F3D9FA' },
};

const MEDALS = ['🥇', '🥈', '🥉'];

const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: '1 Year', value: 365 },
];

export default function Analytics() {
  const [finalized, setFinalized] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [userDetailModal, setUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userCases, setUserCases] = useState({ legalAdvice: [], legalDocument: [], courtRepresentation: [] });
  const [caseTab, setCaseTab] = useState('legalAdvice');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [finalizedRes, usersRes] = await Promise.all([
        fetchFinalizedCases().catch(() => []),
        fetchUsers().catch(() => []),
      ]);
      const finalizedData = Array.isArray(finalizedRes) ? finalizedRes : finalizedRes?.data || [];
      setFinalized(finalizedData);
      const usersData = Array.isArray(usersRes) ? usersRes : usersRes?.data || [];
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filtered cases by date range
  const filteredCases = useMemo(() => {
    if (dateRange === 'all') return finalized;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - dateRange);
    return finalized.filter(f => new Date(f.createdAt) >= cutoff);
  }, [finalized, dateRange]);

  // Personnel stats - matching website logic exactly
  const personnelStats = useMemo(() => {
    const userMap = {};
    users.forEach(u => {
      userMap[u._id] = { firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role };
    });

    const internCounts = {};
    const supervisingLawyerCounts = {};
    const directorCounts = {};

    filteredCases.forEach(c => {
      const internId = c.content?.interviewInfo?.interviewingInternsId;
      const internName = c.content?.interviewInfo?.interviewingInterns;
      if (internId) {
        if (!internCounts[internId]) {
          internCounts[internId] = {
            id: internId,
            name: userMap[internId] ? `${userMap[internId].firstName} ${userMap[internId].lastName}` : (internName || 'Unknown'),
            count: 0,
          };
        }
        internCounts[internId].count++;
      }

      const lawyerId = c.content?.actionInfo?.supervisingLawyerId;
      const lawyerName = c.content?.actionInfo?.supervisingLawyer;
      if (lawyerId) {
        if (!supervisingLawyerCounts[lawyerId]) {
          supervisingLawyerCounts[lawyerId] = {
            id: lawyerId,
            name: userMap[lawyerId] ? `${userMap[lawyerId].firstName} ${userMap[lawyerId].lastName}` : (lawyerName || 'Unknown'),
            count: 0,
          };
        }
        supervisingLawyerCounts[lawyerId].count++;
      }

      const directorId = c.content?.actionInfo?.directorId;
      const directorName = c.content?.actionInfo?.directorSignature;
      if (directorId) {
        if (!directorCounts[directorId]) {
          directorCounts[directorId] = {
            id: directorId,
            name: userMap[directorId] ? `${userMap[directorId].firstName} ${userMap[directorId].lastName}` : (directorName || 'Unknown'),
            count: 0,
          };
        }
        directorCounts[directorId].count++;
      }
    });

    return {
      interns: Object.values(internCounts).sort((a, b) => b.count - a.count),
      lawyers: Object.values(supervisingLawyerCounts).sort((a, b) => b.count - a.count),
      directors: Object.values(directorCounts).sort((a, b) => b.count - a.count),
    };
  }, [filteredCases, users]);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const total = filteredCases.length;
    const accepted = filteredCases.filter(c => c.decision === 'accepted').length;
    const rejected = filteredCases.filter(c => c.decision === 'rejected').length;
    const pending = filteredCases.filter(c => c.decision === 'pending' || !c.decision).length;

    const uniquePersonnel = new Set();
    personnelStats.interns.forEach(p => uniquePersonnel.add(p.id));
    personnelStats.lawyers.forEach(p => uniquePersonnel.add(p.id));
    personnelStats.directors.forEach(p => uniquePersonnel.add(p.id));

    return { total, accepted, rejected, pending, activeUsers: uniquePersonnel.size };
  }, [filteredCases, personnelStats]);

  // Decision donut data
  const decisionData = useMemo(() => {
    const { accepted, rejected, pending, total } = summaryMetrics;
    if (total === 0) return [];
    return [
      { label: 'Accepted', value: accepted, color: '#40C057', pct: Math.round((accepted / total) * 100) },
      { label: 'Rejected', value: rejected, color: '#FA5252', pct: Math.round((rejected / total) * 100) },
      { label: 'Pending', value: pending, color: '#FCC419', pct: Math.round((pending / total) * 100) },
    ].filter(d => d.value > 0);
  }, [summaryMetrics]);

  const handleUserClick = (user, role) => {
    setSelectedUser({ ...user, role });

    let cases = [];
    if (role === 'intern') cases = finalized.filter(c => c.content?.interviewInfo?.interviewingInternsId === user.id);
    else if (role === 'supervising lawyer') cases = finalized.filter(c => c.content?.actionInfo?.supervisingLawyerId === user.id);
    else if (role === 'director') cases = finalized.filter(c => c.content?.actionInfo?.directorId === user.id);

    setUserCases({
      legalAdvice: cases.filter(c => c.content?.interviewInfo?.caseType === 'legal-advice'),
      legalDocument: cases.filter(c => c.content?.interviewInfo?.caseType === 'legal-document'),
      courtRepresentation: cases.filter(c => c.content?.interviewInfo?.caseType === 'court-representation'),
    });
    setCaseTab('legalAdvice');
    setUserDetailModal(true);
  };

  // SVG-based donut chart (same approach as dashboard)
  const renderDonut = () => {
    const size = 150;
    const thickness = 22;
    const total = summaryMetrics.total;
    if (total === 0) return <Text style={s.noData}>No data</Text>;

    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;
    let cumulativePercent = 0;

    return (
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${center}, ${center}`}>
              {decisionData.map((d, i) => {
                const percent = d.value / total;
                const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
                const strokeDashoffset = -circumference * cumulativePercent;
                cumulativePercent += percent;
                return (
                  <SvgCircle
                    key={d.label}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={thickness}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                  />
                );
              })}
            </G>
          </Svg>
          <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: PRIMARY_BROWN }}>{total}</Text>
            <Text style={{ fontSize: 10, color: MUTED_OLIVE }}>Total</Text>
          </View>
        </View>
        <View style={{ marginTop: 14, gap: 8 }}>
          {decisionData.map(d => (
            <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: d.color }} />
              <Text style={{ fontSize: 13, color: CHARCOAL, flex: 1 }}>{d.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: CHARCOAL }}>{d.value} ({d.pct}%)</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderLeaderboard = (title, data, roleColor, role, icon) => {
    const maxCount = data.length > 0 ? data[0].count : 0;

    return (
      <View style={[s.section, { borderTopWidth: 3, borderTopColor: roleColor.primary }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: roleColor.light, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name={icon} size={18} color={roleColor.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: CHARCOAL, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</Text>
            <Text style={{ fontSize: 11, color: MUTED_OLIVE }}>{data.length} active members</Text>
          </View>
        </View>

        {data.length === 0 ? (
          <Text style={s.noData}>No activity recorded yet</Text>
        ) : (
          data.slice(0, 5).map((item, index) => {
            const pct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
            return (
              <TouchableOpacity
                key={item.id}
                style={[s.leaderRow, { backgroundColor: index === 0 ? roleColor.light : 'transparent' }]}
                onPress={() => handleUserClick(item, role)}
              >
                <View style={{ width: 26, alignItems: 'center' }}>
                  {index < 3 ? (
                    <Text style={{ fontSize: 16 }}>{MEDALS[index]}</Text>
                  ) : (
                    <Text style={{ fontSize: 11, color: MUTED_OLIVE, fontWeight: '600' }}>#{index + 1}</Text>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: CHARCOAL }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: roleColor.primary }}>{item.count} Cases</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: '#e8e8e8', borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct}%`, backgroundColor: roleColor.primary, borderRadius: 2 }} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    );
  };

  const CASE_TABS = [
    { key: 'legalAdvice', label: 'Legal Advice', icon: 'document-text-outline' },
    { key: 'legalDocument', label: 'Drafting', icon: 'create-outline' },
    { key: 'courtRepresentation', label: 'Representation', icon: 'scale-outline' },
  ];

  const handleExportPDF = async () => {
    try {
      const now = new Date();
      const timestamp = now.toLocaleString();
      const isoDate = now.toISOString().slice(0, 10);

      const leaderboardHTML = (title, data) => {
        if (!data || data.length === 0) return '';
        const rows = data.slice(0, 10).map((d, i) =>
          `<tr><td style="text-align:center;">${i + 1}</td><td>${d.name}</td><td style="text-align:center;">${d.count}</td></tr>`
        ).join('');
        return `
          <h3 style="color:#8B4513; margin-top:24px;">${title}</h3>
          <table>
            <thead><tr><th>Rank</th><th>Name</th><th>Cases</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      };

      const html = `
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 32px; color: #333; }
            h1 { color: #8B4513; text-align: center; font-size: 24px; margin-bottom: 4px; }
            .timestamp { text-align: center; color: #888; font-size: 12px; margin-bottom: 24px; }
            h3 { font-size: 16px; border-bottom: 2px solid #8B4513; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
            th { background-color: #8B4513; color: #fff; padding: 8px 12px; text-align: left; }
            td { padding: 8px 12px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) { background-color: #f9f7f4; }
            .summary-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
            .summary-card { flex: 1; min-width: 45%; border: 1px solid #eee; border-radius: 8px; padding: 12px; }
            .summary-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
            .summary-value { font-size: 22px; font-weight: 700; color: #8B4513; }
          </style>
        </head>
        <body>
          <h1>JustReach Analytics Report</h1>
          <p class="timestamp">Generated on ${timestamp}</p>

          <h3 style="color:#8B4513;">Summary Overview</h3>
          <table>
            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td>Total Cases</td><td>${summaryMetrics.total}</td></tr>
              <tr><td>Active Personnel</td><td>${summaryMetrics.activeUsers}</td></tr>
              <tr><td>Accepted</td><td>${summaryMetrics.accepted}</td></tr>
              <tr><td>Rejected</td><td>${summaryMetrics.rejected}</td></tr>
              <tr><td>Pending</td><td>${summaryMetrics.pending}</td></tr>
            </tbody>
          </table>

          ${leaderboardHTML('Top Interns', personnelStats.interns)}
          ${leaderboardHTML('Top Lawyers', personnelStats.lawyers)}
          ${leaderboardHTML('Top Directors', personnelStats.directors)}

          <p style="text-align:center; color:#aaa; font-size:10px; margin-top:32px;">© ${now.getFullYear()} SOLA — Sebastinian Office of Legal Aid</p>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const fileName = `Analytics_Report_${isoDate}.pdf`;
      const newUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: newUri });
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Analytics Report',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      if (error.message !== 'User did not share') {
        Alert.alert('Export Failed', 'Could not generate the PDF report. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <AdminSidebarToggle />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <AdminSidebarToggle />
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="bar-chart" size={22} color={PRIMARY_BROWN} />
          <Text style={s.headerTitle}>Performance Analytics</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={handleExportPDF} style={s.refreshBtn}>
            <Ionicons name="download-outline" size={20} color={PRIMARY_BROWN} />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadData} style={s.refreshBtn}>
            <Ionicons name="refresh" size={20} color={PRIMARY_BROWN} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />}
      >
        {/* Date Range Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 8 }}>
          {DATE_RANGES.map(range => (
            <TouchableOpacity
              key={String(range.value)}
              style={[s.rangeBtn, dateRange === range.value && s.rangeBtnActive]}
              onPress={() => setDateRange(range.value)}
            >
              <Text style={[s.rangeBtnText, dateRange === range.value && s.rangeBtnTextActive]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Key Metrics */}
        <View style={s.metricsGrid}>
          <View style={[s.metricCard, { borderLeftColor: '#228BE6' }]}>
            <Text style={s.metricLabel}>Total Cases</Text>
            <Text style={[s.metricValue, { color: '#228BE6' }]}>{summaryMetrics.total}</Text>
            <Text style={s.metricSub}>Processed</Text>
          </View>
          <View style={[s.metricCard, { borderLeftColor: '#40C057' }]}>
            <Text style={s.metricLabel}>Accepted</Text>
            <Text style={[s.metricValue, { color: '#40C057' }]}>{summaryMetrics.accepted}</Text>
            <Text style={s.metricSub}>{summaryMetrics.total > 0 ? `${Math.round((summaryMetrics.accepted / summaryMetrics.total) * 100)}%` : '0%'} rate</Text>
          </View>
          <View style={[s.metricCard, { borderLeftColor: '#FA5252' }]}>
            <Text style={s.metricLabel}>Rejected</Text>
            <Text style={[s.metricValue, { color: '#FA5252' }]}>{summaryMetrics.rejected}</Text>
            <Text style={s.metricSub}>Declined</Text>
          </View>
          <View style={[s.metricCard, { borderLeftColor: '#9C36B5' }]}>
            <Text style={s.metricLabel}>Active Team</Text>
            <Text style={[s.metricValue, { color: '#9C36B5' }]}>{summaryMetrics.activeUsers}</Text>
            <Text style={s.metricSub}>Personnel</Text>
          </View>
        </View>

        {/* Decision Breakdown */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Decision Breakdown</Text>
          {renderDonut()}
        </View>

        {/* Top Performers Header */}
        <View style={{ paddingHorizontal: 16, marginBottom: 4, marginTop: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: PRIMARY_BROWN }}>Top Performers</Text>
          <Text style={{ fontSize: 12, color: MUTED_OLIVE }}>Recognizing the most active contributors</Text>
        </View>

        {/* Leaderboards */}
        {renderLeaderboard('Directors', personnelStats.directors, ROLE_COLORS.director, 'director', 'briefcase-outline')}
        {renderLeaderboard('Supervising Lawyers', personnelStats.lawyers, ROLE_COLORS.lawyer, 'supervising lawyer', 'shield-checkmark-outline')}
        {renderLeaderboard('Interns', personnelStats.interns, ROLE_COLORS.intern, 'intern', 'person-outline')}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* User Detail Modal */}
      <Modal visible={userDetailModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalContainer}>
          <View style={s.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalName}>{selectedUser?.name}</Text>
              <View style={s.roleBadge}>
                <Text style={s.roleBadgeText}>{(selectedUser?.role || '').toUpperCase()}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setUserDetailModal(false)}>
              <Ionicons name="close" size={24} color={CHARCOAL} />
            </TouchableOpacity>
          </View>

          {/* Service Type Summary Cards */}
          <View style={s.serviceCards}>
            <View style={[s.serviceCard, { backgroundColor: `${PRIMARY_BROWN}10` }]}>
              <Ionicons name="document-text-outline" size={22} color={PRIMARY_BROWN} />
              <Text style={s.serviceLabel}>Legal Advice</Text>
              <Text style={s.serviceValue}>{userCases.legalAdvice?.length || 0}</Text>
            </View>
            <View style={[s.serviceCard, { backgroundColor: `${PRIMARY_GOLD}15` }]}>
              <Ionicons name="create-outline" size={22} color={PRIMARY_BROWN} />
              <Text style={s.serviceLabel}>Docs Drafted</Text>
              <Text style={s.serviceValue}>{userCases.legalDocument?.length || 0}</Text>
            </View>
            <View style={[s.serviceCard, { backgroundColor: `${MUTED_OLIVE}10` }]}>
              <Ionicons name="scale-outline" size={22} color={MUTED_OLIVE} />
              <Text style={s.serviceLabel}>Represented</Text>
              <Text style={s.serviceValue}>{userCases.courtRepresentation?.length || 0}</Text>
            </View>
          </View>

          {/* Case Type Tabs */}
          <View style={s.caseTabs}>
            {CASE_TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[s.caseTab, caseTab === tab.key && s.caseTabActive]}
                onPress={() => setCaseTab(tab.key)}
              >
                <Ionicons name={tab.icon} size={14} color={caseTab === tab.key ? '#fff' : MUTED_OLIVE} />
                <Text style={[s.caseTabText, caseTab === tab.key && s.caseTabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cases List */}
          <FlatList
            data={userCases[caseTab] || []}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="folder-open-outline" size={40} color="#ccc" />
                <Text style={{ color: MUTED_OLIVE, marginTop: 8 }}>No cases found</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={s.caseListItem}>
                <View style={{ flex: 1 }}>
                  <Text style={s.caseId}>{item.caseId || 'N/A'}</Text>
                  <Text style={s.caseClient}>{item.clientName || item.content?.interviewInfo?.clientName || 'N/A'}</Text>
                  <Text style={s.caseDate}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</Text>
                </View>
                <View style={[s.decisionBadge, {
                  backgroundColor: item.decision === 'accepted' ? '#40C05720' : item.decision === 'rejected' ? '#FA525220' : '#FCC41920'
                }]}>
                  <Text style={[s.decisionText, {
                    color: item.decision === 'accepted' ? '#40C057' : item.decision === 'rejected' ? '#FA5252' : '#FCC419'
                  }]}>{(item.decision || 'Pending').toUpperCase()}</Text>
                </View>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: PRIMARY_BROWN },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${PRIMARY_BROWN}10`, justifyContent: 'center', alignItems: 'center' },
  rangeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8, marginVertical: 8 },
  rangeBtnActive: { backgroundColor: PRIMARY_BROWN },
  rangeBtnText: { fontSize: 13, color: MUTED_OLIVE },
  rangeBtnTextActive: { color: '#fff', fontWeight: '600' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, gap: 8, marginBottom: 8 },
  metricCard: {
    width: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  metricLabel: { fontSize: 10, fontWeight: '700', color: MUTED_OLIVE, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { fontSize: 26, fontWeight: '800', marginVertical: 2 },
  metricSub: { fontSize: 10, color: MUTED_OLIVE },
  section: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: PRIMARY_BROWN, marginBottom: 14 },
  noData: { textAlign: 'center', color: '#aaa', paddingVertical: 20, fontSize: 13 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, marginBottom: 4 },
  modalContainer: { flex: 1, backgroundColor: '#F7F8FA' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalName: { fontSize: 18, fontWeight: '700', color: CHARCOAL },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: '600', color: MUTED_OLIVE },
  serviceCards: { flexDirection: 'row', padding: 12, gap: 8 },
  serviceCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  serviceLabel: { fontSize: 9, fontWeight: '700', color: MUTED_OLIVE, textTransform: 'uppercase', textAlign: 'center' },
  serviceValue: { fontSize: 20, fontWeight: '800', color: PRIMARY_BROWN },
  caseTabs: { flexDirection: 'row', marginHorizontal: 12, backgroundColor: '#f0f0f0', borderRadius: 10, padding: 3 },
  caseTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8 },
  caseTabActive: { backgroundColor: PRIMARY_BROWN },
  caseTabText: { fontSize: 11, color: MUTED_OLIVE, fontWeight: '500' },
  caseTabTextActive: { color: '#fff', fontWeight: '600' },
  caseListItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
  },
  caseId: { fontSize: 13, fontWeight: '600', color: CHARCOAL },
  caseClient: { fontSize: 12, color: MUTED_OLIVE, marginTop: 2 },
  caseDate: { fontSize: 10, color: '#aaa', marginTop: 2 },
  decisionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  decisionText: { fontSize: 10, fontWeight: '700' },
});
