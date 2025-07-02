import apiClient from './api';

const projectService = {
  // === Project Endpoints ===
  getAllProjects: (params) => {
    return apiClient.get('/projects/', { params });
  },
  getProjectById: (id) => {
    return apiClient.get(`/projects/${id}/`);
  },
  createProject: (projectData) => {
    // created_by is set by backend
    return apiClient.post('/projects/', projectData);
  },
  updateProject: (id, projectData) => {
    return apiClient.put(`/projects/${id}/`, projectData); // Or PATCH
  },
  deleteProject: (id) => {
    return apiClient.delete(`/projects/${id}/`);
  },

  // === Project-specific Task Endpoints (using custom actions on ProjectViewSet) ===
  getProjectTasks: (projectId, params) => {
    return apiClient.get(`/projects/${projectId}/tasks/`, { params });
  },
  createProjectTask: (projectId, taskData) => {
    // project is set by backend context from URL
    return apiClient.post(`/projects/${projectId}/tasks/`, taskData);
  },
  // Individual task updates/deletes would typically go through a standalone task service
  // or more specific custom actions if managed strictly under a project.
  // e.g., updateProjectTask(projectId, taskId, taskData), deleteProjectTask(projectId, taskId)

  // === Project-specific Volunteer Assignment Endpoints ===
  getProjectVolunteerAssignments: (projectId, params) => {
    return apiClient.get(`/projects/${projectId}/volunteer-assignments/`, { params });
  },
  assignVolunteerToProject: (projectId, assignmentData) => {
    // assignmentData: { volunteer_id, role }
    return apiClient.post(`/projects/${projectId}/volunteer-assignments/`, assignmentData);
  },
  // updateProjectVolunteerAssignment, removeProjectVolunteerAssignment ...

  // === Project-specific Volunteer Hours Log Endpoints ===
  getProjectHoursLogs: (projectId, params) => {
    return apiClient.get(`/projects/${projectId}/hours-log/`, { params });
  },
  logHoursForProject: (projectId, hoursData) => {
    // hoursData: { volunteer_id, date, hours_worked, description }
    return apiClient.post(`/projects/${projectId}/hours-log/`, hoursData);
  },
  // updateProjectHoursLog, deleteProjectHoursLog ...

  // === Standalone Task, Assignment, HoursLog services (if needed for general management) ===
  // These would mirror the standalone ViewSet endpoints
  // getAllTasks: (params) => apiClient.get('/tasks/', { params }),
  // getTaskById: (id) => apiClient.get(`/tasks/${id}/`),
  // createTask: (taskData) => apiClient.post('/tasks/', taskData), // requires project_id in taskData
  // updateTask: (id, taskData) => apiClient.put(`/tasks/${id}/`, taskData),
  // deleteTask: (id) => apiClient.delete(`/tasks/${id}/`),
  // ... and similarly for ProjectVolunteerAssignment and VolunteerHoursLog if standalone management is a primary use case.
};

export default projectService;
