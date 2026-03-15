# TRG Living Admin Panel - Context

## Key Architectural Decisions
- **Media Library Abstraction**: Pivoted to a relational media warehouse model. This enables asset reusability, single-source metadata management, and improved storage efficiency.
- **Permission Dependency Management**: Resolved multi-table policy dependencies to ensure reliable role verification during data operations.
- **SSR Client Standardization**: Adopted the non-deprecated `@supabase/ssr` pattern for robust session handling in high-concurrency environments.

## Data Integrity & Security Features
- **Payload Sanitization**: Implemented strict property destructuring in all forms to prevent unauthorized field mutation.
- **Access Control Hardening**: Enforced explicit role-based checks at the database level for all write operations.
- **Content State Management**: Implemented strict status-checking logic at the query layer to ensure internal drafts remain isolated from public views.

## Technical Resiliency
- **Client-Side Hydration Resilience**: Adopted the "Mounted Component" pattern to ensure UI stability across various browser rendering engines and privacy settings.
- **Fault-Tolerant Joins**: Configured media relationships to support graceful degradation in the event of missing assets.
- **Network Stack Stabilization**: Resolved local environment port conflicts to ensure 1:1 Docker-to-Host communication.

## Last Updated: 2026-03-15
## Next Steps: Implement "Edit Region" management; expand Media Library picker functionality.