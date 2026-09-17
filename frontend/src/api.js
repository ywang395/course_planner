export async function getCourses(signal) {
  const response = await fetch('/api/courses', { signal });

  if (!response.ok) {
    throw new Error(`Could not load courses (HTTP ${response.status}). Check that Spring Boot and PostgreSQL are running, then retry.`);
  }

  const courses = await response.json();
  if (!Array.isArray(courses)) {
    throw new Error('The API returned an unexpected response instead of a course list.');
  }

  return courses;
}

export async function createPlan(signal) {
  
}
