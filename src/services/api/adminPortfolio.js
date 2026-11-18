import { apiDelete, apiGet, apiPatch, apiPost } from './httpClient';

const ROOT = '/admin/portfolio';

function queryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export const getAdminProfile = (options = {}) => apiGet(`${ROOT}/profile`, options);
export const updateAdminProfile = (payload, options = {}) => apiPatch(`${ROOT}/profile`, payload, options);

export const getAdminSocialLinks = (options = {}) => apiGet(`${ROOT}/social-links`, options);
export const createAdminSocialLink = (payload, options = {}) => apiPost(`${ROOT}/social-links`, payload, options);
export const updateAdminSocialLink = (id, payload, options = {}) => apiPatch(`${ROOT}/social-links/${encodeURIComponent(id)}`, payload, options);
export const deleteAdminSocialLink = (id, options = {}) => apiDelete(`${ROOT}/social-links/${encodeURIComponent(id)}`, options);

export const getAdminSkills = (options = {}) => apiGet(`${ROOT}/skills`, options);
export const createAdminSkill = (payload, options = {}) => apiPost(`${ROOT}/skills`, payload, options);
export const updateAdminSkill = (id, payload, options = {}) => apiPatch(`${ROOT}/skills/${encodeURIComponent(id)}`, payload, options);
export const deleteAdminSkill = (id, options = {}) => apiDelete(`${ROOT}/skills/${encodeURIComponent(id)}`, options);

export const getAdminCategories = (options = {}) => apiGet(`${ROOT}/categories`, options);
export const createAdminCategory = (payload, options = {}) => apiPost(`${ROOT}/categories`, payload, options);
export const updateAdminCategory = (id, payload, options = {}) => apiPatch(`${ROOT}/categories/${encodeURIComponent(id)}`, payload, options);
export const deleteAdminCategory = (id, options = {}) => apiDelete(`${ROOT}/categories/${encodeURIComponent(id)}`, options);

export const getAdminProjects = (params = {}, options = {}) => apiGet(`${ROOT}/projects${queryString(params)}`, options);
export const getAdminProject = (id, options = {}) => apiGet(`${ROOT}/projects/${encodeURIComponent(id)}`, options);
export const createAdminProject = (payload, options = {}) => apiPost(`${ROOT}/projects`, payload, options);
export const updateAdminProject = (id, payload, options = {}) => apiPatch(`${ROOT}/projects/${encodeURIComponent(id)}`, payload, options);
export const deleteAdminProject = (id, options = {}) => apiDelete(`${ROOT}/projects/${encodeURIComponent(id)}`, options);
export const publishAdminProject = (id, options = {}) => apiPost(`${ROOT}/projects/${encodeURIComponent(id)}/publish`, {}, options);
export const unpublishAdminProject = (id, options = {}) => apiPost(`${ROOT}/projects/${encodeURIComponent(id)}/unpublish`, {}, options);

const CHILD_KINDS = new Set(['technologies', 'highlights', 'collaborators']);
function childPath(projectId, kind, childId = '') {
  if (!CHILD_KINDS.has(kind)) throw new TypeError('Tipo de relación de proyecto no válido.');
  const base = `${ROOT}/projects/${encodeURIComponent(projectId)}/${kind}`;
  return childId ? `${base}/${encodeURIComponent(childId)}` : base;
}

export const getAdminProjectChildren = (projectId, kind, options = {}) => apiGet(childPath(projectId, kind), options);
export const createAdminProjectChild = (projectId, kind, payload, options = {}) => apiPost(childPath(projectId, kind), payload, options);
export const updateAdminProjectChild = (projectId, kind, childId, payload, options = {}) => apiPatch(childPath(projectId, kind, childId), payload, options);
export const deleteAdminProjectChild = (projectId, kind, childId, options = {}) => apiDelete(childPath(projectId, kind, childId), options);
