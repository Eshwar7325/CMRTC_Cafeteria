# CMR Cafeteria

A modern web application for managing food orders at CMR College cafeteria. This system allows students to order food from multiple stalls and track their orders in real-time.

## Features

- Three food stalls: Main Canteen, Sandwich Stall, and Fries Stall
- User authentication for students and stall admins
- Real-time order tracking
- Digital receipts and tokens
- Admin panel for managing orders and inventory
- Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: React Hooks
- **Styling**: Tailwind CSS

## Prerequisites

Before you begin, ensure you have installed:

- Node.js 18.x or later
- npm or yarn
- PostgreSQL

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/cmr-cafeteria.git
   cd cmr-cafeteria
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then, update the environment variables in `.env.local` with your values.

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── dashboard/         # User dashboard
│   ├── menu/              # Menu and ordering
│   └── track-order/       # Order tracking
├── components/            # Reusable components
├── lib/                   # Utility functions and configurations
│   ├── db/               # Database configurations
│   └── utils/            # Helper functions
└── public/               # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- CMR College for the opportunity to develop this system
- All contributors who have helped to improve this project
"# arjun" 
