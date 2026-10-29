export function SetupGuide() {
  return (
    <aside className="setup-guide">
      <p className="eyebrow">Install tips</p>
      <h2>Start with an empty workspace</h2>
      <ol>
        <li>Name the workspace and yourself. Nothing is created until you finish.</li>
        <li>Choose local use, or connect Firebase Authentication before inviting a team.</li>
        <li>Add an AI key only if you want summaries and reports. The tool works without one.</li>
        <li>After setup, create the first project, then add tickets yourself.</li>
      </ol>
      <h3>Connect Firebase login</h3>
      <ol>
        <li>Open the Firebase console and create a project.</li>
        <li>Go to Build, then Authentication, and enable Email/Password.</li>
        <li>In Project settings, add a Web app and copy the config.</li>
        <li>Under Authentication, then Settings, then Authorized domains, add the domain where you host Atlas.</li>
        <li>Paste the API key, auth domain, project ID, and app ID here.</li>
      </ol>
      <p>The Firebase web config is public by design. Atlas never stores the password.</p>
    </aside>
  )
}
