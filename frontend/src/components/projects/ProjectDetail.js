import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import projectService from '../../services/projectService';
import { format } from 'date-fns';

// Simple sub-component for listing tasks (can be expanded)
const TaskList = ({ tasks }) => (
    <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
        {tasks.map(task => (
            <li key={task.id}>
                <strong>{task.title}</strong> (Status: {task.status_display || task.status}, Priority: {task.priority_display || task.priority})
                {task.due_date && ` - Due: ${format(new Date(task.due_date), 'yyyy-MM-dd')}`}
                <br />
                <small>{task.description || 'No description.'}</small>
                {task.assigned_to_volunteer && <small> | Assigned to: {task.assigned_to_volunteer.full_name}</small>}
            </li>
        ))}
    </ul>
);

// Simple sub-component for listing assigned volunteers
const AssignedVolunteerList = ({ assignments }) => (
    <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
        {assignments.map(assign => (
            <li key={assign.id}>
                <strong>{assign.volunteer?.full_name || 'N/A'}</strong> (Role: {assign.role || 'N/A'})
                <br />
                <small>Assigned on: {assign.date_assigned ? format(new Date(assign.date_assigned), 'yyyy-MM-dd') : 'N/A'}</small>
            </li>
        ))}
    </ul>
);

// Simple sub-component for listing logged hours
const HoursLogList = ({ logs }) => (
     <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
        {logs.map(log => (
            <li key={log.id}>
                <strong>{log.hours_worked} hours</strong> by {log.volunteer?.full_name || 'N/A'} on {log.date ? format(new Date(log.date), 'yyyy-MM-dd') : 'N/A'}
                <br />
                <small>Description: {log.description || 'N/A'}</small>
            </li>
        ))}
    </ul>
);


const ProjectDetail = () => {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [hoursLogs, setHoursLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id: projectId } = useParams();

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const projectRes = await projectService.getProjectById(projectId);
        setProject(projectRes.data);

        const tasksRes = await projectService.getProjectTasks(projectId);
        setTasks(tasksRes.data.results || tasksRes.data);

        const assignmentsRes = await projectService.getProjectVolunteerAssignments(projectId);
        setAssignments(assignmentsRes.data.results || assignmentsRes.data);

        const hoursLogsRes = await projectService.getProjectHoursLogs(projectId);
        setHoursLogs(hoursLogsRes.data.results || hoursLogsRes.data);

        setError(null);
      } catch (err) {
        setError(err.message || `Failed to fetch project data for ID ${projectId}.`);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectData();
  }, [projectId]);

  if (loading) return <p>Loading project details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!project) return <p>Project not found.</p>;

  // TODO: Forms for adding tasks, assigning volunteers, logging hours would go here or be modals

  return (
    <div>
      <h2>Project: {project.name} (ID: {project.id})</h2>
      <Link to={`/projects/${project.id}/edit`} style={{ marginRight: '10px' }}>
        <button>Edit Project Info</button>
      </Link>
      <Link to="/projects">
        <button>Back to Projects List</button>
      </Link>

      <div style={{ border: '1px solid #eee', padding: '15px', margin: '15px 0' }}>
        <h4>Project Information</h4>
        <p><strong>Description:</strong> {project.description || 'N/A'}</p>
        <p><strong>Status:</strong> {project.status_display || project.status}</p>
        <p><strong>Start Date:</strong> {project.start_date ? format(new Date(project.start_date), 'PPP') : 'N/A'}</p>
        <p><strong>End Date:</strong> {project.end_date ? format(new Date(project.end_date), 'PPP') : 'N/A'}</p>
        <p><strong>Budget:</strong> {project.budget ? `$${parseFloat(project.budget).toFixed(2)}` : 'N/A'}</p>
        <p><strong>Location:</strong> {project.location || 'N/A'}</p>
        <p><strong>Created By:</strong> {project.created_by?.username || 'N/A'}</p>
        <p><strong>Tasks Count (from annotation):</strong> {project.tasks_count !== undefined ? project.tasks_count : '(Not loaded)'}</p>
      </div>

      <div style={{ border: '1px solid #eee', padding: '15px', margin: '15px 0' }}>
        <h4>Tasks
          {/* <button style={{marginLeft: '10px'}} onClick={() => alert('Open Add Task form/modal')}>+ Add Task</button> */}
        </h4>
        {tasks.length > 0 ? <TaskList tasks={tasks} /> : <p>No tasks for this project yet.</p>}
        {/* TODO: Add Task Form/Modal */}
      </div>

      <div style={{ border: '1px solid #eee', padding: '15px', margin: '15px 0' }}>
        <h4>Assigned Volunteers
          {/* <button style={{marginLeft: '10px'}} onClick={() => alert('Open Assign Volunteer form/modal')}>+ Assign Volunteer</button> */}
        </h4>
        {assignments.length > 0 ? <AssignedVolunteerList assignments={assignments} /> : <p>No volunteers assigned to this project yet.</p>}
        {/* TODO: Assign Volunteer Form/Modal */}
      </div>

      <div style={{ border: '1px solid #eee', padding: '15px', margin: '15px 0' }}>
        <h4>Logged Hours
          {/* <button style={{marginLeft: '10px'}} onClick={() => alert('Open Log Hours form/modal')}>+ Log Hours</button> */}
        </h4>
        {hoursLogs.length > 0 ? <HoursLogList logs={hoursLogs} /> : <p>No hours logged for this project yet.</p>}
        {/* TODO: Log Hours Form/Modal */}
      </div>
    </div>
  );
};

export default ProjectDetail;
