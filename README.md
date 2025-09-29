# FlowMind: A Visual AI Workflow Builder

FlowMind is a powerful visual workflow builder that leverages AI to enhance productivity and streamline processes. This application allows users to create, manage, and execute workflows visually, making it easier to automate tasks and collaborate with team members.

## Features

- **Visual Workflow Creation**: Drag and drop interface to design workflows.
- **AI Integration**: Utilize AI services for enhanced functionality.
- **Collaboration Tools**: Work together with team members in real-time.
- **Analytics Dashboard**: Monitor workflow performance and analytics.

## Installation

To get started with FlowMind, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/FlowMind.git
   ```

2. Navigate to the project directory:
   ```
   cd FlowMind
   ```

3. Install the dependencies (Bun is recommended, but npm/yarn also work):
   ```bash
   bun install
   ```

4. Start the development server:
   ```bash
   bun run start
   ```

## Environment Variables

Create a `.env` file in the project root and configure the following variables:

```bash
# Server
PORT=5000
AI_API_KEY=your-default-ai-key
D1_DATABASE_URL=your-cloudflare-d1-url
D1_DATABASE_AUTH_TOKEN=your-d1-auth-token
JWT_SECRET=change-me-to-a-long-random-string
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
BCRYPT_SALT_ROUNDS=10
```

The frontend automatically discovers `GOOGLE_CLIENT_ID` from the backend via `/api/auth/config`. If the value is missing, Google Sign-In will be disabled in the UI.

## Usage

Once the server is running, open your browser and navigate to `http://localhost:3000` to access the application. You can start creating workflows by using the visual builder interface.

## Contributing

We welcome contributions to FlowMind! If you have suggestions or improvements, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.