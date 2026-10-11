(function (root) {
  const needsGrading = record => !record || record.flags?.length > 0 || ['pending', 'supplement'].includes(record.status);
  function nextStudent(students, currentCode, records, prefix) {
    const index = students.findIndex(s => s.code === currentCode);
    const following = [...students.slice(index + 1), ...students.slice(0, Math.max(index, 0))];
    return following.find(s => needsGrading(records[prefix + s.code]))?.code || null;
  }
  const queue = { needsGrading, nextStudent };
  if (typeof module !== 'undefined') module.exports = queue;
  else root.GradebookQueue = queue;
})(typeof window !== 'undefined' ? window : globalThis);
