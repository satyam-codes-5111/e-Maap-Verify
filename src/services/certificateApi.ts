import api, { getApiBaseUrl } from './api';
import { CertificateItem, PublicVerificationResult, ApiResponse } from '../types';

export const certificateApi = {
  getCertificates: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<{ certificates: CertificateItem[]; pagination?: any }>>('/certificates', {
      params,
    });
    return res.data;
  },

  getCertificateById: async (id: string) => {
    const res = await api.get<ApiResponse<CertificateItem>>(`/certificates/${id}`);
    return res.data;
  },

  generateCertificate: async (inspectionId: string) => {
    const res = await api.post<ApiResponse<CertificateItem>>(`/certificates/generate/${inspectionId}`);
    return res.data;
  },

  revokeCertificate: async (id: string, reason: string) => {
    const res = await api.patch<ApiResponse<CertificateItem>>(`/certificates/${id}/revoke`, { reason });
    return res.data;
  },

  verifyPublic: async (token: string) => {
    const res = await api.get<ApiResponse<PublicVerificationResult>>(`/public/certificates/verify/${encodeURIComponent(token)}`);
    return res.data;
  },

  downloadPdfUrl: (id: string) => {
    const baseURL = getApiBaseUrl();
    return `${baseURL}/certificates/${id}/pdf`;
  },

  downloadCertificatePdf: async (id: string, customFilename?: string): Promise<void> => {
    try {
      const response = await api.get(`/certificates/${id}/pdf`, {
        responseType: 'blob',
      });

      // Determine filename
      let filename = customFilename;
      if (!filename) {
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition.includes('filename=')) {
          const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }
      }
      if (!filename) {
        filename = `Verification_Certificate_${id}.pdf`;
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) {
            err.message = json.message;
          }
        } catch {
          // ignore parsing error
        }
      }
      throw err;
    }
  },
};
