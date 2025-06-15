"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Layout } from "../components/layout/Layout"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Search, Filter, User, Edit, Lock, Trash2 } from "lucide-react"
import type { User as UserType } from "../types"
import { useAuthStore } from "../store/authStore"
import { Navigate } from "react-router-dom"
import { getAllUsers, updateUserByAdmin, updateUserRole, updateUserStatus, deleteUser } from "../lib/supabase"

export const AdminUsersPage = () => {
  const { user } = useAuthStore()
  const [users, setUsers] = useState<UserType[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (user && user.role === "admin") {
      setIsAdmin(true)
    } else {
      setIsAdmin(false)
    }
  }, [user])

  // Проверяем доступ
  if (!isAdmin) {
    return <Navigate to="/" />
  }

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data, error } = await getAllUsers()

        if (error) throw error

        if (data) {
          setUsers(data)
          setFilteredUsers(data)
        }
      } catch (error: any) {
        console.error("Ошибка при загрузке пользователей:", error)
        setError("Не удалось загрузить пользователей")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Фильтрация пользователей
  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = filterRole === "" || user.role === filterRole
      const matchesStatus =
        filterStatus === "" ||
        (filterStatus === "active" && !user.is_blocked) ||
        (filterStatus === "blocked" && user.is_blocked)

      return matchesSearch && matchesRole && matchesStatus
    })

    setFilteredUsers(filtered)
  }, [users, searchTerm, filterRole, filterStatus])

  // Обработчики действий
  const handleEditUser = (userData: UserType) => {
    setEditingUser(userData)
    setShowEditModal(true)
  }

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const { data, error } = await updateUserByAdmin(userId, updates)

      if (error) throw error

      // Обновляем локальное состояние
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...updates } : u)))
      setShowEditModal(false)
      setEditingUser(null)
    } catch (err) {
      console.error("Ошибка при обновлении пользователя:", err)
      setError("Не удалось обновить пользователя")
    }
  }

  const handleChangeRole = async (userId: string, newRole: "user" | "moderator" | "admin") => {
    try {
      const { error } = await updateUserRole(userId, newRole)

      if (error) throw error

      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    } catch (err) {
      console.error("Ошибка при изменении роли:", err)
      setError("Не удалось изменить роль пользователя")
    }
  }

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      const { error } = await updateUserStatus(userId, block)

      if (error) throw error

      setUsers(users.map((u) => (u.id === userId ? { ...u, is_blocked: block } : u)))
    } catch (err) {
      console.error("Ошибка при блокировке пользователя:", err)
      setError("Не удалось изменить статус пользователя")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.")) {
      return
    }

    try {
      const { error } = await deleteUser(userId)

      if (error) throw error

      setUsers(users.filter((u) => u.id !== userId))
    } catch (err) {
      console.error("Ошибка при удалении пользователя:", err)
      setError("Не удалось удалить пользователя")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ru-RU")
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор"
      case "moderator":
        return "Модератор"
      case "user":
        return "Пользователь"
      default:
        return "Неизвестно"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "moderator":
        return "bg-purple-100 text-purple-800"
      case "user":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Управление пользователями</h1>
          <p className="text-gray-600">Просмотр и редактирование информации о пользователях</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Закрыть
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Поиск пользователей..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center">
              <Filter size={18} className="mr-2" />
              Фильтры
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Роль пользователя</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  >
                    <option value="">Все роли</option>
                    <option value="user">Пользователи</option>
                    <option value="moderator">Модераторы</option>
                    <option value="admin">Администраторы</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  >
                    <option value="">Все статусы</option>
                    <option value="active">Активные</option>
                    <option value="blocked">Заблокированные</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterRole("")
                    setFilterStatus("")
                  }}
                  className="mr-2"
                >
                  Сбросить
                </Button>
                <Button size="sm" onClick={() => setShowFilters(false)}>
                  Применить
                </Button>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Загрузка пользователей...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-100">
            <User size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Пользователи не найдены</h3>
            <p className="text-gray-600">Попробуйте изменить параметры поиска или фильтры</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата регистрации
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {userData.avatar_url ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={userData.avatar_url || "/placeholder.svg"}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                {userData.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{userData.username}</div>
                            <div className="text-sm text-gray-500">ID: {userData.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{userData.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={userData.role}
                          onChange={(e) => handleChangeRole(userData.id, e.target.value as any)}
                          className={`px-2 py-1 text-xs rounded-full border-0 ${getRoleColor(userData.role)}`}
                        >
                          <option value="user">Пользователь</option>
                          <option value="moderator">Модератор</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            userData.is_blocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {userData.is_blocked ? "Заблокирован" : "Активен"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(userData.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => handleEditUser(userData)}
                            className="text-blue-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50"
                            title="Редактировать"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleBlockUser(userData.id, !userData.is_blocked)}
                            className={`p-1 rounded-md ${
                              userData.is_blocked
                                ? "text-green-400 hover:text-green-600 hover:bg-green-50"
                                : "text-red-400 hover:text-red-600 hover:bg-red-50"
                            }`}
                            title={userData.is_blocked ? "Разблокировать" : "Заблокировать"}
                          >
                            <Lock size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(userData.id)}
                            className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50"
                            title="Удалить"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Модальное окно редактирования */}
        {showEditModal && editingUser && (
          <EditUserModal
            user={editingUser}
            onSave={(updates) => handleUpdateUser(editingUser.id, updates)}
            onClose={() => {
              setShowEditModal(false)
              setEditingUser(null)
            }}
          />
        )}
      </div>
    </Layout>
  )
}

// Компонент модального окна редактирования
const EditUserModal = ({
  user,
  onSave,
  onClose,
}: {
  user: UserType
  onSave: (updates: any) => void
  onClose: () => void
}) => {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    full_name: user.full_name || "",
    weight: user.weight || "",
    height: user.height || "",
    goal: user.goal || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      username: formData.username,
      email: formData.email,
      full_name: formData.full_name || null,
      weight: formData.weight ? Number(formData.weight) : null,
      height: formData.height ? Number(formData.height) : null,
      goal: formData.goal || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Редактировать пользователя</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя пользователя</label>
            <Input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Полное имя</label>
            <Input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Вес (кг)</label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Рост (см)</label>
              <Input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цель</label>
            <Input
              type="text"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
