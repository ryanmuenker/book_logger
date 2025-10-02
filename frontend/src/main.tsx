import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { App } from './pages/App'
import { Books } from './pages/Books'
import { BookDetail } from './pages/BookDetail'
import { BookForm } from './pages/BookForm'
import { Search } from './pages/Search'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { MyLibrary } from './pages/MyLibrary'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Books /> },
      { path: 'books/:id', element: <BookDetail /> },
      { path: 'books/new', element: <BookForm /> },
      { path: 'books/:id/edit', element: <BookForm /> },
      { path: 'search', element: <Search /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'my', element: <MyLibrary /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)


