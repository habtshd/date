# Dating App

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

# Dating

## The Protocol

A modern dating platform built on verified identity principles. Users control their identity and data while connecting based on shared values and relationship goals.

## Architecture

```mermaid
graph TD
    A[User Device / Browser] -->|HTTPS| B[(IPFS Network)]
    B --> C[Cloudflare Edge Storage]
    C -->|Authentication| D[Identity Providers (Fayda)]
    D -->|Data Verification| E[Blockchain / Verifiable Credentials]
    E -->|Matching Algorithm| F[Decentralized Matchmaking Services]
    
    subgraph Frontend
        A
        G[Web Application]
        H[Mobile Application]
    end
    
    subgraph Backend
        F
        I[User Profile Services]
        J[Message Queuing]
        K[Analytics Engine]
    end
    
    G -->|IPFS Content Addressing| B
    H -->|IPFS Content Addressing| B
    
    I -->|Read/Write| F
    I -->|Generate Credentials| E
    J -->|Process Matches| I
    K -->|Generate Insights| I
```

## Technology Stack

- **Frontend**: Flutter (Web & Mobile)
- **Storage**: IPFS (Decentralized Content Storage)
- **CDN**: Cloudflare Edge Network (Global Distribution)
- **Identity**: Verifiable Credentials, Decentralized Identifiers (DIDs)
- **Blockchain**: Polygon (or similar EVM-compatible chain)
- **Backend**: Node.js, Python (for AI/ML matching)
- **Database**: Distributed SQL (e.g., CockroachDB)

## Key Features

### 1. Verified Identity
- Users own their profile data (encrypted on IPFS)
- Credential verification proves relationship goals without centralized authority
- Privacy-preserving authentication via DIDs

### 2. Decentralized Matchmaking
- AI-powered matching algorithm
- Transparent matching criteria (users see why they're matched)
- Community-driven reputation system

### 3. Privacy-First Communication
- End-to-end encrypted messaging
- Message routing via decentralized network
- Message history stored on user's device

### 4. Content Distribution
- Profile photos, videos, and documents on IPFS
- Fast global access via Cloudflare Edge
- Automatic content moderation via decentralized agents

## Project Structure

```
sovereign_dating/
├── web/                      # Web application (Flutter Web)
├── mobile/                   # Mobile application (Flutter Mobile)
├── backend/                  # Server-side logic
│   ├── matching/             # AI matching algorithms
│   ├── identity/             # DID and Verifiable Credential management
│   └── messaging/            # Encrypted messaging services
├── data/                     # Data schemas and models
│   ├── profiles/             # User profile structures
│   ├── credentials/          # Credential templates
│   └── matchmaking/        # Matching algorithms and models
└── docs/                     # Documentation
```

## Getting Started

### Prerequisites
- Flutter SDK (stable channel)
- Node.js (for backend services)
- Python (for AI/ML)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sovereign_dating
   ```

2. Install dependencies:
   ```bash
   cd web
   flutter pub get
   
   cd ../mobile
   flutter pub get
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Configure your IPFS, blockchain, and other credentials
   ```

### Running the Application

**Web Application:**
```bash
cd web
flutter run -d edge
```

**Mobile Application:**
```bash
cd mobile
flutter run -d chrome  # or your target device/emulator
```

## Development Guidelines

### Code Style
- Use Dart 3.0+ with strong typing
- Follow the official Flutter style guide
- Keep functions pure where possible
- Use dependency injection for testability

### Testing
```bash
# Run unit tests
flutter test

# Run widget tests
flutter test --widget

# Run integration tests
flutter test integration_test
```

### Performance
- Optimize IPFS content retrieval (use caching where appropriate)
- Implement lazy loading for media assets
- Use stream-based data processing for real-time matching

## Deployment

### Web Deployment
```bash
cd web
flutter build web --release --web-renderer html
# Upload contents of build/web to Cloudflare Edge Storage
```

### Mobile Deployment
```bash
cd mobile
flutter build apk --release
flutter build appbundle --release
```

## Contributing

1. Create a feature branch:
   ```bash
   git checkout -b feat/new-feature
   ```

2. Make your changes

3. Submit a pull request with detailed description

4. Ensure all CI checks pass:
   ```bash
   flutter analyze
   flutter test
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions, please open an issue on the GitHub repository.

---

**Built for genuine, verified human connection.**
