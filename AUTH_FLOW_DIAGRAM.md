```mermaid
flowchart TD
    %% Entry Points
    A[👤 User visits /signin] --> B[🎨 FormaOS Branded Login]
    A1[👤 User visits /auth/signup] --> B1[🎨 FormaOS Branded Signup]

    %% Authentication Methods
    B --> C{🔐 Auth Method?}
    B1 --> C1{📝 Signup Method?}

    C -->|🔵 Google OAuth| D[🌐 Google Authentication]
    C -->|📧 Email/Password| E[🔑 Email Authentication]

    C1 -->|🔵 Google OAuth| D1[🌐 Google Signup]
    C1 -->|📧 Email/Password| E1[📝 Email Signup]

    %% Callback Processing
    D --> F[⚙️ /auth/callback]
    E --> F
    D1 --> F
    E1 --> F

    %% User Type Detection
    F --> G{👑 User Type?}

    %% Founder Flow
    G -->|🔑 Founder| H[🏛️ Founder Admin Setup]
    H --> H1[✅ Set Owner Role & Pro Plan]
    H1 --> H2[🎯 Redirect to /admin/dashboard]

    %% Regular User Flow
    G -->|👤 Regular User| I{🏢 Organization Exists?}

    %% New User Setup
    I -->|❌ No| J[🏗️ Create Organization]
    J --> J1[👥 Create Org Membership]
    J1 --> J2[🔗 Initialize Compliance Graph]
    J2 --> J3[📊 Create Initial Nodes]
    J3 --> J4[🔄 Establish Wires]
    J4 --> M[🎯 Redirect to /onboarding]

    %% Existing User Processing
    I -->|✅ Yes| K[📋 Load Organization Data]
    K --> K1[🔍 Validate Compliance Graph]
    K1 --> K2{🔧 Graph Issues?}

    K2 -->|⚠️ Yes| K3[🛠️ Auto-Repair Graph]
    K3 --> K4[📝 Log Repair Actions]
    K4 --> L

    K2 -->|✅ No| L{📚 Onboarding Complete?}

    %% Routing Decision
    L -->|❌ Incomplete| M
    L -->|✅ Complete| P[🎯 Redirect to /app]

    %% Final Destinations
    M --> R[🎓 Onboarding Wizard]
    P --> S[📊 Application Dashboard]
    H2 --> Q[👑 Admin Console]

    %% Node Creation Details
    J3 --> N1[🏢 Organization Node]
    J3 --> N2[👤 Role Node]
    J3 --> N3[📋 Policy Nodes]
    J3 --> N4[🏗️ Entity Node]
    J3 --> N5[📊 Audit Node]

    %% Wire Establishment
    J4 --> W1[🔗 Org ↔ User Wire]
    J4 --> W2[🔗 User ↔ Role Wire]
    J4 --> W3[🔗 Policy ↔ Task Wire]
    J4 --> W4[🔗 Audit Trail Wire]

    %% Compliance Graph Components
    subgraph CG[🏗️ Compliance Graph]
        N1
        N2
        N3
        N4
        N5
        W1
        W2
        W3
        W4
    end

    %% Styling
    classDef entry fill:#e0f2fe,stroke:#0369a1,stroke-width:2px
    classDef process fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px
    classDef endpoint fill:#f3e8ff,stroke:#9333ea,stroke-width:2px
    classDef founder fill:#fef2f2,stroke:#dc2626,stroke-width:2px
    classDef graph fill:#ecfdf5,stroke:#10b981,stroke-width:2px

    class A,A1,B,B1 entry
    class F,J,J1,J2,K,K1,K3 process
    class C,C1,G,I,K2,L decision
    class R,S,Q endpoint
    class H,H1,H2 founder
    class CG graph
```
