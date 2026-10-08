# 🚀 CodeAlpha Task 3 – Project Management Tool

A full-stack collaborative **Project Management Tool** developed as part of my **CodeAlpha Full Stack Development Internship**.

The application is designed to help users create and manage projects, organize tasks using project boards, assign tasks to team members, and communicate through task comments.

---

## 📌 Project Overview

Managing team projects can become difficult when tasks, responsibilities, deadlines, and communication are handled separately.

This project provides a centralized platform where users can:

- Create and manage group projects
- Create and organize tasks
- Assign tasks to team members
- Track task progress
- Communicate through task comments
- Manage projects through a visual project board
- Authenticate users securely

The application follows a full-stack architecture with a frontend, backend, authentication system, and database.

---

## ✨ Features

### 🔐 Authentication
- User registration
- User login
- Secure authentication
- Protected application pages

### 📁 Project Management
- Create projects
- View projects
- Manage project information
- Collaborate with team members

### 📋 Task Management
- Create task cards
- Assign tasks to users
- Update task status
- Organize tasks using project boards
- Track task progress

### 💬 Task Communication
- Add comments to tasks
- View task discussions
- Communicate with project members

### 📊 Project Board
Tasks can be organized according to their current status:

```text
┌──────────────┐
│    TO DO     │
└──────────────┘

┌──────────────┐
│ IN PROGRESS  │
└──────────────┘

┌──────────────┐
│     DONE     │
└──────────────┘
```

This provides a simple visual way to understand project progress.

---

## 🛠️ Technologies Used

### Frontend
- React
- Next.js
- TypeScript
- HTML
- CSS

### Backend
- Next.js / API-based backend
- Server-side application logic

### Authentication
- User authentication
- Protected routes/pages

### Development Tools
- VS Code
- Git
- GitHub
- pnpm

---

## 🏗️ Application Architecture

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Frontend        │
                    │ React / Next.js     │
                    └──────────┬──────────┘
                               │
                         API Requests
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Backend / API Layer │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
          ┌────────────┐ ┌───────────┐ ┌───────────┐
          │   Users    │ │ Projects  │ │   Tasks   │
          └────────────┘ └───────────┘ └───────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │  Comments   │
                        └─────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │  Database   │
                        └─────────────┘
```

---

## 📂 Project Structure

```text
project-management-tool/
│
├── app/
│   ├── pages/
│   └── ...
│
├── components/
│   ├── dashboard/
│   ├── projects/
│   ├── tasks/
│   └── ...
│
├── lib/
│   └── ...
│
├── public/
│   └── ...
│
├── package.json
├── pnpm-lock.yaml
├── next.config.mjs
├── tsconfig.json
└── README.md
```

> The exact folder structure may vary depending on the final implementation.

---

## ⚙️ How to Run the Project

### Prerequisites

Install:

- Node.js
- pnpm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/CodeAlpha_ProjectManagementTool.git
```

### 2. Navigate to the project

```bash
cd CodeAlpha_ProjectManagementTool
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Start the development server

```bash
pnpm dev
```

### 5. Open the application

Open your browser and visit:

```text
http://localhost:3000
```

---

## 🎥 Project Demo

A demonstration video of the Project Management Tool is available on my LinkedIn post.

The demo showcases:

- User authentication
- Project creation
- Project dashboard
- Task creation
- Task assignment
- Task status management
- Task comments
- Project board workflow

🔗 **Demo Video:** https://drive.google.com/file/d/1OHiXflDlxXW1xzw6zwc6zg6KXmDbvr73/view?usp=sharing


## 🚀 Future Enhancements

Possible future improvements include:

- 🔔 Real-time notifications
- ⚡ WebSocket-based real-time updates
- 📅 Task deadlines and reminders
- 📊 Advanced project analytics
- 👥 Improved team management
- 🔎 Advanced search and filtering
- 📎 File attachments
- 📱 Improved mobile experience


## 🔗 Links

**Demo Video:**  
https://drive.google.com/file/d/1OHiXflDlxXW1xzw6zwc6zg6KXmDbvr73/view?usp=sharing


I would like to thank **CodeAlpha** for providing me with this internship opportunity and allowing me to gain practical experience by developing a real-world project management application.

#CodeAlpha #FullStackDevelopment #ProjectManagement #WebDevelopment #Internship
