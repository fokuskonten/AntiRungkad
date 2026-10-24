// ══════════════════════════════════════════════════════════════════════════════
// src/services/api_client.js — FokusKonten Master Server API Client
// Handles JWT Auth, Server-Side RNG Spins & Provably Fair Verification
// ══════════════════════════════════════════════════════════════════════════════

class ApiClient {
  constructor() {
    this.baseUrl = '';
    this.tokenKey = 'antirungkad_jwt_token';
    this.userKey = 'antirungkad_user_profile';
    this.sessionIdKey = 'antirungkad_guest_session_id';
    
    // Inisialisasi guest session ID jika belum ada
    if (!localStorage.getItem(this.sessionIdKey)) {
      localStorage.setItem(this.sessionIdKey, 'guest_' + Math.random().toString(36).substring(2, 10));
    }
  }

  getAuthToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setAuthToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
  }

  getUserProfile() {
    try {
      const data = localStorage.getItem(this.userKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setUserProfile(user) {
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.userKey);
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'X-Session-Id': localStorage.getItem(this.sessionIdKey) || 'guest_default'
    };
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async checkServerHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/antirungkad/status`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server tidak terjangkau di Port 8090', error: err.message };
    }
  }

  async login(username, password) {
    try {
      const appIds = ['antirungkad', 'apotek_pro', 'whatsapp_lead_crm'];
      let lastResult = null;

      for (const appId of appIds) {
        const res = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId,
            username: username.trim(),
            password
          })
        });
        const data = await res.json();
        if (data.success && data.token) {
          this.setAuthToken(data.token);
          this.setUserProfile(data.user);
          return data;
        }
        lastResult = data;
        // Jika password salah tapi user ditemukan, hentikan loop
        if (data.message && data.message.includes('Kata sandi salah')) {
          return data;
        }
      }
      return lastResult || { success: false, message: 'ID Pengguna tidak ditemukan.' };
    } catch (err) {
      return { success: false, message: 'Gagal menghubungi server autentikasi: ' + err.message };
    }
  }

  logout() {
    this.setAuthToken(null);
    this.setUserProfile(null);
  }

  async initSession() {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/antirungkad/session/init`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          username: this.getUserProfile()?.username || 'GuestPlayer'
        })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Gagal inisialisasi sesi: ' + err.message };
    }
  }

  async executeSpin(betAmount, customClientSeed = null) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/antirungkad/spin`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          betAmount,
          clientSeed: customClientSeed
        })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Gagal melakukan putaran di server: ' + err.message };
    }
  }

  async topup(amount = 100000) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/antirungkad/topup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ amount })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Gagal top-up koin: ' + err.message };
    }
  }

  async verifyRound(verifyPayload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/antirungkad/verify`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(verifyPayload)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Gagal memverifikasi hash: ' + err.message };
    }
  }
}

export const apiClient = new ApiClient();
