// Team member invite, role management

import { supabase } from './supabaseClient.js';
import { showNotification } from './ui.js';
import { formatDate } from './helpers.js';

export async function loadTeamMembers() {
  const container = document.getElementById('team-members-list');
  if (!container) return;

  try {
    // Mevcut kullanıcının takımını bul
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showNotification('Please log in to view team members', 'error');
      return;
    }

    // Önce kullanıcının takımını bul
    const { data: userTeam, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single();

    if (teamError || !userTeam) {
      container.innerHTML = `
        <div class="settings-empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
          </svg>
          <div class="settings-empty-state-title">No team found</div>
          <div class="settings-empty-state-description">You are not part of any team</div>
        </div>
      `;
      return;
    }

    // Takım üyelerini getir (user bilgileriyle birlikte)
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        ),
        inviter:invited_by (
          email
        )
      `)
      .eq('team_id', userTeam.team_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data.length === 0) {
      container.innerHTML = `
        <div class="settings-empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
          </svg>
          <div class="settings-empty-state-title">No team members</div>
          <div class="settings-empty-state-description">Invite team members to collaborate</div>
        </div>
      `;
      return;
    }

    container.innerHTML = data.map(member => `
      <div class="settings-list-item">
        <div class="settings-list-item-info">
          <div class="settings-list-item-name">
            ${member.profiles?.full_name || member.profiles?.email || 'Unknown User'}
            ${!member.joined_at ? ' <span style="color: #ea580c;">(Pending)</span>' : ''}
          </div>
          <div class="settings-list-item-desc">
            ${member.profiles?.email || 'No email'} · ${member.role} 
            ${member.invited_at ? `· Invited ${formatDate(member.invited_at)}` : ''}
            ${member.inviter ? ` by ${member.inviter.email}` : ''}
          </div>
        </div>
        <div class="settings-list-item-actions">
          <select class="settings-form-input" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" 
                  onchange="updateTeamMemberRole('${member.id}', this.value)"
                  ${member.user_id === user.id ? 'disabled' : ''}>
            <option value="admin" ${member.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="producer" ${member.role === 'producer' ? 'selected' : ''}>Producer</option>
            <option value="operator" ${member.role === 'operator' ? 'selected' : ''}>Operator</option>
          </select>
          ${member.user_id !== user.id ? `
            <button class="settings-btn settings-btn-danger" onclick="removeTeamMember('${member.id}')">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Remove
            </button>
          ` : `
            <span class="settings-btn settings-btn-outline" style="cursor: default; opacity: 0.6;">
              You
            </span>
          `}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading team members:', error);
    container.innerHTML = '<p class="text-sm text-red-300">Error loading team members</p>';
  }
}

export function initTeamInvite() {
  const btnInvite = document.getElementById('btn-invite-member');
  if (!btnInvite) return;

  btnInvite.addEventListener('click', () => {
    showInviteModal();
  });
}

async function showInviteModal() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Kullanıcının takımını bul
  const { data: userTeam } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single();

  if (!userTeam) {
    showNotification('You are not part of any team', 'error');
    return;
  }

  const modalHTML = `
    <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 0; min-width: 400px; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        <div class="modal-header" style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: between; align-items: center;">
          <h3 class="modal-title" style="font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0;">Invite Team Member</h3>
          <button class="modal-close" onclick="closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280;">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem;">
          <form id="invite-form" class="settings-form">
            <div class="settings-form-group">
              <label class="settings-form-label">Email Address</label>
              <input type="email" id="invite-email" class="settings-form-input" placeholder="team@example.com" required>
            </div>
            <div class="settings-form-group">
              <label class="settings-form-label">Role</label>
              <select id="invite-role" class="settings-form-input">
                <option value="operator">Operator</option>
                <option value="producer">Producer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="settings-form-group">
              <p class="settings-form-label" style="font-size: 0.75rem; color: #6b7280;">
                An invitation email will be sent to the user. They need to accept the invitation to join your team.
              </p>
            </div>
          </form>
        </div>
        <div class="modal-footer" style="padding: 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button class="settings-btn settings-btn-outline" onclick="closeModal()">Cancel</button>
          <button class="settings-btn settings-btn-primary" onclick="submitInvite('${userTeam.team_id}', '${user.id}')">Send Invitation</button>
        </div>
      </div>
    </div>
  `;

  // Add modal to page
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  // Make functions globally available
  window.closeModal = () => {
    if (document.body.contains(modalContainer)) {
      document.body.removeChild(modalContainer);
    }
  };

  // Close modal when clicking outside
  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) {
      closeModal();
    }
  });
}

// Submit invite function
window.submitInvite = async (teamId, invitedById) => {
  const email = document.getElementById('invite-email').value;
  const role = document.getElementById('invite-role').value;

  if (!email) {
    showNotification('Please enter an email address', 'error');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }

  try {
    // Önce kullanıcıyı bul
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    let userId;

    if (userError || !userData) {
      // Kullanıcı yoksa, invite-only kaydı oluştur
      // Bu durumda user_id için geçici bir UUID kullanabiliriz
      // veya auth.users'a yeni kullanıcı oluşturabiliriz
      showNotification('User not found. Please ensure the user has an account.', 'error');
      return;
    } else {
      userId = userData.id;
    }

    // Takım üyesi ekle
    const { data, error } = await supabase
      .from('team_members')
      .insert([
        {
          team_id: teamId,
          user_id: userId,
          role: role,
          invited_by: invitedById,
          invited_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique violation
        showNotification('This user is already in your team', 'error');
      } else {
        throw error;
      }
      return;
    }

    showNotification(`Invitation sent to ${email}`, 'success');
    window.closeModal();
    loadTeamMembers();
  } catch (error) {
    console.error('Error inviting team member:', error);
    showNotification('Error sending invitation', 'error');
  }
};

// Update team member role
async function updateTeamMemberRole(memberId, newRole) {
  try {
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) throw error;

    showNotification('Role updated successfully', 'success');
  } catch (error) {
    console.error('Error updating role:', error);
    showNotification('Error updating role', 'error');
    loadTeamMembers(); // Reload to reset the select
  }
}

// Remove team member function
async function removeTeamMember(memberId) {
  if (!confirm('Are you sure you want to remove this team member from your team?')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;

    showNotification('Team member removed successfully', 'success');
    loadTeamMembers();
  } catch (error) {
    console.error('Error removing team member:', error);
    showNotification('Error removing team member', 'error');
  }
}

// Make functions globally available
window.removeTeamMember = removeTeamMember;
window.updateTeamMemberRole = updateTeamMemberRole;

// Initialize
if (document.getElementById('team-members-list')) {
  loadTeamMembers();
  initTeamInvite();
}