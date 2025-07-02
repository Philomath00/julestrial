import React, { useState, useEffect } from 'react';
import projectService from '../../services/projectService';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await projectService.getAllProjects();
        setProjects(response.data.results || response.data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch projects.');
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete project ${id}? This may also delete related tasks, assignments, and logs depending on backend cascade rules.`)) {
      try {
        await projectService.deleteProject(id);
        setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
        alert(`Project ${id} deleted successfully.`);
      } catch (err) {
        alert(`Failed to delete project ${id}: ${err.message} - ${err.response?.data?.detail || ''}`);
        console.error("Delete error:", err.response?.data || err);
      }
    }
  };

  if (loading) return <p>Loading projects...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!projects.length) {
    return (
      <div>
        <p>No projects found.</p>
        <Link to="/projects/new"><button>Add New Project</button></Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Projects</h2>
      <Link to="/projects/new">
        <button style={{ marginBottom: '1em' }}>Add New Project</button>
      </Link>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{padding: '8px'}}>ID</th>
            <th style={{padding: '8px'}}>Name</th>
            <th style={{padding: '8px'}}>Status</th>
            <th style={{padding: '8px'}}>Start Date</th>
            <th style={{padding: '8px'}}>End Date</th>
            <th style={{padding: '8px'}}>Budget</th>
            {/* <th style={{padding: '8px'}}>Tasks Count</th> */}
            <th style={{padding: '8px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td style={{padding: '8px'}}>{project.id}</td>
              <td style={{padding: '8px'}}>{project.name}</td>
              <td style={{padding: '8px'}}>{project.status_display || project.status}</td>
              <td style={{padding: '8px'}}>{project.start_date ? format(new Date(project.start_date), 'yyyy-MM-dd') : 'N/A'}</td>
              <td style={{padding: '8px'}}>{project.end_date ? format(new Date(project.end_date), 'yyyy-MM-dd') : 'N/A'}</td>
              <td style={{padding: '8px', textAlign: 'right'}}>{project.budget ? `$${parseFloat(project.budget).toFixed(2)}` : 'N/A'}</td>
              {/* <td style={{padding: '8px', textAlign: 'center'}}>{project.tasks_count !== undefined ? project.tasks_count : 'N/A'}</td> */}
              <td style={{padding: '8px', textAlign: 'center'}}>
                <Link to={`/projects/${project.id}`} style={{ marginRight: '5px' }}>
                  <button>View/Manage</button>
                </Link>
                <Link to={`/projects/${project.id}/edit`} style={{ marginRight: '5px' }}>
                  <button>Edit Info</button>
                </Link>
                <button onClick={() => handleDelete(project.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectList;
