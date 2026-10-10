import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const iconPaths = {
  upload: <><path d="M12 17V4m0 0 5 5m-5-5L7 9" /><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></>,
  book: <><path d="M4 6.5c3.9-1.4 7.1-.8 10 1.5v13c-2.9-2.3-6.1-2.9-10-1.5v-13Z" /><path d="M24 8c2.9-2.3 6.1-2.9 10-1.5v13c-3.9-1.4-7.1-.8-10 1.5V8Z" transform="translate(-2 0)" /><path d="M23 8v13" /></>,
  folder: <><path d="M3.5 9.5h9l2.5 3h17.5v12a2 2 0 0 1-2 2h-25a2 2 0 0 1-2-2v-15Z" /><path d="M3.5 9.5V7a2 2 0 0 1 2-2h7l2.5 3h8" /></>,
  people: <><circle cx="13" cy="11" r="4" /><path d="M5 29c0-5 3.2-8 8-8s8 3 8 8" /><path d="M22 8a4 4 0 0 1 0 7.5m3 2c3.2.9 4.8 3.2 5 6.5" /></>,
  chat: <><path d="M5 6.5h26a2.5 2.5 0 0 1 2.5 2.5v15a2.5 2.5 0 0 1-2.5 2.5H16l-8 5v-5H5A2.5 2.5 0 0 1 2.5 24V9A2.5 2.5 0 0 1 5 6.5Z" /><path d="M10 15h.01M18 15h.01M26 15h.01" /></>,
  document: <><path d="M9 4.5h12l6 6v20H9a2 2 0 0 1-2-2v-22a2 2 0 0 1 2-2Z" /><path d="M21 4.5v6h6M12 17h12M12 22h9" /></>
};

const DashboardIcon = ({ name, className = '' }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {iconPaths[name]}
  </svg>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await api.get('/notes');
        setRecentNotes(response.data.notes.slice(0, 5));
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const isStaff = user?.role === 'teacher' || user?.role === 'admin';
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const yearNumber = Number(user?.year) || 1;
  const yearSuffix = yearNumber === 1 ? 'st' : yearNumber === 2 ? 'nd' : yearNumber === 3 ? 'rd' : 'th';
  const welcome = user?.role === 'teacher'
    ? 'Share material with your courses and keep up with classroom activity.'
    : user?.role === 'admin'
      ? 'Manage learning resources and keep your community connected.'
      : `Your ${yearNumber}${yearSuffix} year, all in one place.`;

  const actions = [
    ...(isStaff ? [{ to: '/upload-notes', index: '01', title: 'Share material', detail: 'Add a resource for your course', icon: 'upload' }] : []),
    { to: '/browse-notes', index: isStaff ? '02' : '01', title: 'Browse materials', detail: 'Find resources by subject and year', icon: 'book' },
    ...(isStaff
      ? [{ to: '/subjects', index: '03', title: 'Course subjects', detail: 'Explore your course curriculum', icon: 'folder' }]
      : [
          { to: '/friends', index: '02', title: 'Connect with classmates', detail: 'Find people from your courses', icon: 'people' },
          { to: '/chat', index: '03', title: 'Open study rooms', detail: 'Join a course conversation', icon: 'chat' }
        ])
  ];

  return (
    <div className="study-page dashboard-page">
      <div className="dashboard-topline">
        <span>STUDYSYNC <i>/</i> WORKSPACE</span>
        <span>{user?.role || 'student'}{user?.role === 'student' ? ` · YEAR ${yearNumber}` : ''}</span>
      </div>

      <header className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="dashboard-eyebrow">YOUR LEARNING SPACE</p>
          <h1>Good to see you, <em>{firstName}.</em></h1>
          <p className="dashboard-welcome">{welcome}</p>
        </div>
        <div className="dashboard-imprint" aria-hidden="true">
          <img src="/studySync.svg" alt="" />
          <span>COURSES · MATERIALS · PEOPLE</span>
        </div>
      </header>

      <section className="dashboard-actions-section" aria-labelledby="dashboard-actions-title">
        <div className="dashboard-section-heading">
          <h2 id="dashboard-actions-title">Quick access</h2>
          <span>YOUR WORKSPACE <i>↘</i></span>
        </div>
        <div className="dashboard-actions">
          {actions.map((action) => (
            <Link to={action.to} className="dashboard-action" key={action.to}>
              <span className="dashboard-action-index">{action.index}</span>
              <DashboardIcon name={action.icon} className="dashboard-action-icon" />
              <span className="dashboard-action-copy">
                <strong>{action.title}</strong>
                <small>{action.detail}</small>
              </span>
              <span className="dashboard-action-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-materials" aria-labelledby="dashboard-materials-title">
        <div className="dashboard-materials-heading">
          <div>
            <p className="dashboard-eyebrow">COURSE RESOURCES</p>
            <h2 id="dashboard-materials-title">Recent materials</h2>
          </div>
          <Link to="/browse-notes" className="dashboard-text-link">View all materials <span aria-hidden="true">↗</span></Link>
        </div>

        {loading ? (
          <div className="dashboard-note-list" aria-label="Loading recent notes">
            {[1, 2, 3].map((item) => (
              <div className="dashboard-note-row dashboard-note-skeleton" key={item}>
                <span /><div><i /><i /></div><i />
              </div>
            ))}
          </div>
        ) : recentNotes.length === 0 ? (
          <div className="dashboard-empty-state">
            <DashboardIcon name="document" className="dashboard-empty-icon" />
            <div>
              <h3>No materials yet</h3>
              <p>Resources shared with your courses will appear here.</p>
            </div>
            {isStaff && <Link to="/upload-notes" className="dashboard-text-link">Share a resource <span aria-hidden="true">↗</span></Link>}
          </div>
        ) : (
          <div className="dashboard-note-list">
            {recentNotes.map((note) => {
              const metadata = [
                note.subject?.name,
                note.branch?.name || note.branch,
                note.year ? `Year ${note.year}` : null,
                note.semester ? `Semester ${note.semester}` : null
              ].filter(Boolean).join(' · ');

              return (
                <article className="dashboard-note-row" key={note._id}>
                  <span className="dashboard-note-type">{note.fileType?.toUpperCase() || 'NOTE'}</span>
                  <div className="dashboard-note-copy">
                    <h3>{note.title}</h3>
                    <p>{metadata || 'Shared course material'}</p>
                  </div>
                  <a className="dashboard-note-link" href={note.fileUrl} target="_blank" rel="noopener noreferrer">
                    Open file <span aria-hidden="true">↗</span>
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
