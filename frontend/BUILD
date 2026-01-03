# Frontend BUILD file for Next.js app

shell_sources(name="frontend_scripts")

shell_command(
    name="install",
    command="npm install",
    workdir="frontend",
    tools=["npm", "node"],
    description="Install frontend dependencies",
)

shell_command(
    name="dev",
    command="npm run dev",
    workdir="frontend",
    tools=["npm", "node"],
    description="Run frontend development server",
)

shell_command(
    name="build",
    command="npm run build",
    workdir="frontend",
    tools=["npm", "node"],
    description="Build frontend for production",
)

shell_command(
    name="lint",
    command="npm run lint",
    workdir="frontend",
    tools=["npm", "node"],
    description="Lint frontend code",
)
