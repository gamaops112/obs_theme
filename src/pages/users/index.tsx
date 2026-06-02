import { useState, useMemo } from 'react'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  Tabs, Tab, Button, TextField, Select, MenuItem, Tooltip, IconButton, Grid, Card, CardContent,
  TablePagination, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import {
  Search, Mail, UserPlus, Pencil, UserMinus, Bell, BellOff, Check,
  Shield, VolumeX, AlertTriangle, CheckCircle, LayoutDashboard,
  Database, Settings, Download, Key,
} from 'lucide-react'
import { notify } from '../../lib/toast'
import CreateUserModal from './components/CreateUserModal'
import InviteMemberModal from './components/InviteMemberModal'

interface UserData {
  id: string; name: string; email: string; role: 'Admin' | 'Editor' | 'Viewer'
  status: 'active' | 'pending'; lastSeen: string; avatar: string
}

const initialUsers: UserData[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@obsadmin.io', role: 'Admin' as const, status: 'active' as const, lastSeen: 'just now', avatar: 'AU' },
  { id: 'u2', name: 'John Doe', email: 'john@obsadmin.io', role: 'Editor' as const, status: 'active' as const, lastSeen: '2h ago', avatar: 'JD' },
  { id: 'u3', name: 'Jane Smith', email: 'jane@obsadmin.io', role: 'Editor' as const, status: 'active' as const, lastSeen: '1d ago', avatar: 'JS' },
  { id: 'u4', name: 'Bob Chen', email: 'bob@obsadmin.io', role: 'Viewer' as const, status: 'active' as const, lastSeen: '3d ago', avatar: 'BC' },
  { id: 'u5', name: 'Alice Kumar', email: 'alice@obsadmin.io', role: 'Viewer' as const, status: 'active' as const, lastSeen: '1w ago', avatar: 'AK' },
  { id: 'u6', name: 'Pending User', email: 'pending@company.com', role: 'Viewer' as const, status: 'pending' as const, lastSeen: '—', avatar: 'PU' },
]

const roleColors: Record<string, 'primary' | 'secondary' | 'default'> = { Admin: 'primary', Editor: 'secondary', Viewer: 'default' }

const roles = [
  { name: 'Admin', description: 'Full access to all features and settings', memberCount: 1, permissions: ['View all data', 'Create/edit alert rules', 'Manage users', 'Configure data sources', 'Delete data', 'Manage integrations'] },
  { name: 'Editor', description: 'Can edit but not manage users or delete data', memberCount: 3, permissions: ['View all data', 'Create/edit alert rules', 'Configure dashboards', 'Invite team members', 'Acknowledge incidents'] },
  { name: 'Viewer', description: 'Read-only access to all data', memberCount: 2, permissions: ['View dashboards', 'View logs and traces', 'View alerts', 'View incidents', 'Export data'] },
]

const auditLog = [
  { time: '14:23', user: 'Admin User', action: 'created_alert_rule', target: 'High Error Rate', ip: '192.168.1.1' },
  { time: '14:21', user: 'Admin User', action: 'invited_user', target: 'newdev@company.com', ip: '192.168.1.1' },
  { time: '14:18', user: 'John Doe', action: 'acknowledged_alert', target: 'Payment Timeout', ip: '192.168.1.4' },
  { time: '14:15', user: 'John Doe', action: 'silenced_alert', target: 'CPU Spike', ip: '192.168.1.4' },
  { time: '14:11', user: 'Admin User', action: 'created_incident', target: 'INC-001', ip: '192.168.1.1' },
  { time: '14:08', user: 'Jane Smith', action: 'updated_dashboard', target: 'Main Dashboard', ip: '192.168.1.7' },
  { time: '14:05', user: 'Admin User', action: 'changed_user_role', target: 'Bob Chen → Viewer', ip: '192.168.1.1' },
  { time: '14:01', user: 'John Doe', action: 'created_monitor', target: 'API Health Check', ip: '192.168.1.4' },
  { time: '13:58', user: 'Admin User', action: 'invited_user', target: 'pending@company', ip: '192.168.1.1' },
  { time: '13:55', user: 'Jane Smith', action: 'deleted_alert_rule', target: 'Disk Space Low', ip: '192.168.1.7' },
  { time: '13:50', user: 'Admin User', action: 'connected_datasource', target: 'Prometheus', ip: '192.168.1.1' },
  { time: '13:45', user: 'Jane Smith', action: 'updated_dashboard', target: 'Infra Overview', ip: '192.168.1.7' },
  { time: '13:40', user: 'John Doe', action: 'resolved_incident', target: 'INC-003', ip: '192.168.1.4' },
  { time: '13:35', user: 'Admin User', action: 'created_user', target: 'alice@obsadmin.io', ip: '192.168.1.1' },
  { time: '13:30', user: 'Bob Chen', action: 'exported_logs', target: 'search-service', ip: '192.168.1.9' },
  { time: '13:25', user: 'Jane Smith', action: 'created_alert_rule', target: 'Queue Depth', ip: '192.168.1.7' },
  { time: '13:20', user: 'Admin User', action: 'updated_settings', target: 'General Settings', ip: '192.168.1.1' },
  { time: '13:15', user: 'John Doe', action: 'silenced_alert', target: 'Memory Usage', ip: '192.168.1.4' },
  { time: '13:10', user: 'Admin User', action: 'revoked_api_key', target: 'Old CI Key', ip: '192.168.1.1' },
  { time: '13:05', user: 'Jane Smith', action: 'created_monitor', target: 'SSL Certificate', ip: '192.168.1.7' },
]

const actionConfig: Record<string, { icon: typeof Bell; label: string; color: string }> = {
  created_alert_rule: { icon: Bell, label: 'Created alert rule', color: '#06b6d4' },
  deleted_alert_rule: { icon: BellOff, label: 'Deleted alert rule', color: '#ef4444' },
  invited_user: { icon: UserPlus, label: 'Invited user', color: '#8b5cf6' },
  created_user: { icon: UserPlus, label: 'Created user', color: '#8b5cf6' },
  changed_user_role: { icon: Shield, label: 'Changed user role', color: '#f59e0b' },
  removed_user: { icon: UserMinus, label: 'Removed user', color: '#ef4444' },
  silenced_alert: { icon: VolumeX, label: 'Silenced alert', color: '#f59e0b' },
  acknowledged_alert: { icon: Check, label: 'Acknowledged alert', color: '#10b981' },
  created_incident: { icon: AlertTriangle, label: 'Created incident', color: '#ef4444' },
  resolved_incident: { icon: CheckCircle, label: 'Resolved incident', color: '#10b981' },
  updated_dashboard: { icon: LayoutDashboard, label: 'Updated dashboard', color: '#06b6d4' },
  created_monitor: { icon: Bell, label: 'Created monitor', color: '#06b6d4' },
  connected_datasource: { icon: Database, label: 'Connected data source', color: '#10b981' },
  updated_settings: { icon: Settings, label: 'Updated settings', color: '#8b93a8' },
  exported_logs: { icon: Download, label: 'Exported logs', color: '#8b93a8' },
  revoked_api_key: { icon: Key, label: 'Revoked API key', color: '#ef4444' },
}

export default function Users() {
  const theme = useTheme()
  const [tab, setTab] = useState(0)
  const [users, setUsers] = useState<UserData[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [auditSearch, setAuditSearch] = useState('')
  const [userFilterAudit, setUserFilterAudit] = useState('all')
  const [actionTypeFilter, setActionTypeFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  const filteredUsers = useMemo(() => users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  }), [users, search, roleFilter, statusFilter])

  const userToRemove = confirmRemove ? users.find((u) => u.id === confirmRemove) : null

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole as UserData['role'] } : u))
    const user = users.find((u) => u.id === userId)
    notify.success(`${user?.name}'s role updated to ${newRole}`)
  }

  const handleRemoveUser = () => {
    if (!confirmRemove) return
    setUsers((prev) => prev.filter((u) => u.id !== confirmRemove))
    notify.success(`${userToRemove?.name} removed`)
    setConfirmRemove(null)
  }

  const filteredAudit = useMemo(() => auditLog.filter((e) => {
    const matchSearch = e.target.toLowerCase().includes(auditSearch.toLowerCase()) || e.user.toLowerCase().includes(auditSearch.toLowerCase())
    const matchUser = userFilterAudit === 'all' || e.user === userFilterAudit
    let matchType = true
    if (actionTypeFilter === 'alert') matchType = e.action.includes('alert')
    if (actionTypeFilter === 'user') matchType = e.action.includes('user') || e.action.includes('invited')
    if (actionTypeFilter === 'incident') matchType = e.action.includes('incident')
    if (actionTypeFilter === 'settings') matchType = e.action.includes('settings') || e.action.includes('dashboard') || e.action.includes('api_key') || e.action.includes('datasource')
    return matchSearch && matchUser && matchType
  }), [auditSearch, userFilterAudit, actionTypeFilter])

  const pagedAudit = filteredAudit.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>Users</Typography>
      <Typography variant="caption2" sx={{ color: 'text.secondary', mb: 3, display: 'block' }}>
        {users.length} members &bull; {users.filter((u) => u.status === 'pending').length} pending invite
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Members" /><Tab label="Roles" /><Tab label="Audit Log" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)}
              slotProps={{ input: { startAdornment: <Search size={14} color="#8b93a8" style={{ marginRight: 6 }} /> } }} sx={{ width: 260 }} />
            <Select size="small" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ fontSize: 13, minWidth: 130 }}>
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Editor">Editor</MenuItem>
              <MenuItem value="Viewer">Viewer</MenuItem>
            </Select>
            <Select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ fontSize: 13, minWidth: 130 }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
            <Box sx={{ flex: 1 }} />
            <Button variant="outlined" size="small" startIcon={<Mail size={14} />} onClick={() => setInviteOpen(true)} sx={{ fontSize: 13 }}>Invite Member</Button>
            <Button variant="contained" size="small" startIcon={<UserPlus size={14} />} onClick={() => setCreateOpen(true)} sx={{ fontSize: 13 }}>Add User</Button>
          </Box>

          <TableContainer component={Paper} sx={{ background: 'transparent', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={200} sx={headSx}>Name</TableCell>
                  <TableCell width={220} sx={headSx}>Email</TableCell>
                  <TableCell width={120} sx={headSx}>Role</TableCell>
                  <TableCell width={80} sx={headSx}>Status</TableCell>
                  <TableCell width={120} sx={headSx}>Last Seen</TableCell>
                  <TableCell width={100} align="right" sx={headSx}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} hover sx={{ height: 36 }}>
                    <TableCell sx={cellSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#1a2540', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{u.avatar}</Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{u.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ ...cellSx, fontFamily: theme.typography.mono.fontFamily }}>{u.email}</TableCell>
                    <TableCell sx={{ ...cellSx, width: 120 }}>
                      {editingRole === u.id ? (
                        <Select size="small" value={u.role} autoFocus
                          onBlur={() => setEditingRole(null)}
                          onChange={(e) => { handleRoleChange(u.id, e.target.value); setEditingRole(null) }}
                          sx={{ height: 28, fontSize: 12 }}>
                          <MenuItem value="Admin">Admin</MenuItem>
                          <MenuItem value="Editor">Editor</MenuItem>
                          <MenuItem value="Viewer">Viewer</MenuItem>
                        </Select>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: u.status !== 'pending' ? 'pointer' : 'default' }}
                          onClick={() => u.status !== 'pending' && setEditingRole(u.id)}>
                          <Chip label={u.role} color={roleColors[u.role]} size="small"
                            sx={{ borderRadius: '3px', fontSize: 11, fontWeight: 500 }} />
                          {u.status !== 'pending' && <Pencil size={11} style={{ opacity: 0.3 }} />}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: u.status === 'active' ? '#10b981' : '#f59e0b' }} />
                        <Typography variant="caption2" sx={{ color: u.status === 'active' ? '#10b981' : '#f59e0b', textTransform: 'capitalize', fontWeight: 500 }}>{u.status}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ ...cellSx, color: 'text.secondary' }}>{u.lastSeen}</TableCell>
                    <TableCell align="right" sx={cellSx}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Edit user"><IconButton size="small" onClick={() => setCreateOpen(true)}><Pencil size={13} /></IconButton></Tooltip>
                        {u.id !== 'u1' && (
                          <Tooltip title="Remove user"><IconButton size="small" onClick={() => setConfirmRemove(u.id)}><UserMinus size={13} color="#ef4444" /></IconButton></Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 1 && (
        <Grid container spacing={2}>
          {roles.map((role) => (
            <Grid key={role.name} size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', border: `1px solid ${role.name === 'Admin' ? alpha(theme.palette.primary.main, 0.4) : theme.palette.divider}`, bgcolor: role.name === 'Admin' ? alpha(theme.palette.primary.main, 0.04) : 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h4">{role.name}</Typography>
                    {role.name === 'Admin' && <Chip label="Full Access" color="primary" size="small" />}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>{role.description}</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                    {role.permissions.map((perm) => (
                      <Box key={perm} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Check size={13} color={theme.palette.success.main} />
                        <Typography variant="caption" sx={{ color: 'text.primary' }}>{perm}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{role.memberCount} member{role.memberCount !== 1 ? 's' : ''}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Search audit log..." value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)}
              slotProps={{ input: { startAdornment: <Search size={14} color="#8b93a8" style={{ marginRight: 6 }} /> } }} sx={{ width: 260 }} />
            <Select size="small" value={userFilterAudit} onChange={(e) => setUserFilterAudit(e.target.value)} sx={{ fontSize: 13, minWidth: 160 }}>
              <MenuItem value="all">All Users</MenuItem>
              {users.map((u) => <MenuItem key={u.id} value={u.name}>{u.name}</MenuItem>)}
            </Select>
            <Select size="small" value={actionTypeFilter} onChange={(e) => setActionTypeFilter(e.target.value)} sx={{ fontSize: 13, minWidth: 180 }}>
              <MenuItem value="all">All Actions</MenuItem>
              <MenuItem value="alert">Alert actions</MenuItem>
              <MenuItem value="user">User actions</MenuItem>
              <MenuItem value="incident">Incident actions</MenuItem>
              <MenuItem value="settings">Settings changes</MenuItem>
            </Select>
            <Box sx={{ flex: 1 }} />
            <Button variant="outlined" size="small" startIcon={<Download size={13} />} sx={{ fontSize: 13 }}>Export</Button>
          </Box>

          <TableContainer component={Paper} sx={{ background: 'transparent', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={80} sx={headSx}>Time</TableCell>
                  <TableCell width={140} sx={headSx}>User</TableCell>
                  <TableCell width={280} sx={headSx}>Action</TableCell>
                  <TableCell width={180} sx={headSx}>Target</TableCell>
                  <TableCell width={120} sx={headSx}>IP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedAudit.map((e, i) => {
                  const config = actionConfig[e.action]
                  const IconComponent = config?.icon || Bell
                  return (
                    <TableRow key={i} hover sx={{ height: 36 }}>
                      <TableCell sx={{ ...cellSx, fontFamily: theme.typography.mono.fontFamily, color: 'text.secondary' }}>{e.time}</TableCell>
                      <TableCell sx={cellSx}>{e.user}</TableCell>
                      <TableCell sx={{ ...cellSx, width: 280 }}>
                        {config ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ p: 0.5, borderRadius: '4px', background: alpha(config.color, 0.1), display: 'flex' }}>
                              <IconComponent size={13} color={config.color} />
                            </Box>
                            <Typography variant="body2">{config.label}</Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2">{e.action}</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ ...cellSx, fontFamily: theme.typography.mono.fontFamily }}>{e.target}</TableCell>
                      <TableCell sx={{ ...cellSx, fontFamily: theme.typography.mono.fontFamily, color: 'text.disabled', fontSize: 12 }}>
                        {e.ip}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredAudit.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Box>
      )}

      <Dialog open={!!confirmRemove} onClose={() => setConfirmRemove(null)} maxWidth="xs">
        <DialogTitle>Remove {userToRemove?.name}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">This will revoke their access to obsAdmin immediately.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemove(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleRemoveUser}>Remove</Button>
        </DialogActions>
      </Dialog>

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </Box>
  )
}

const headSx = { color: 'text.secondary', fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, borderColor: 'divider', py: 1 }
const cellSx = { fontSize: 13, color: 'text.primary', borderColor: 'divider', py: '7px' }
