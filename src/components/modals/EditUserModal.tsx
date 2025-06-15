"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { X, User, Mail, Shield, Lock } from "lucide-react"
import type { User as UserType, UserRole } from "../../types"
import { updateUserByAdmin, updateUserRole, updateUserStatus } from "../../lib/supabase"

interface EditUserModalProps {
  user: UserType
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedUser: UserType) => void
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    full_name: user.full_name || "",
    weight: user.weight || "",
    height: user.height || "",
    goal: user.goal || "",
    role: user.role,
    is_blocked: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name || "",
        weight: user.weight || "",
        height: user.height || "",
        goal: user.goal || "",
        role: user.role,
        is_blocked: false,
      })
      setError(null)
    }
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Обновляем основные данные пользователя
      const { data: userData, error: userError } = await updateUserByAdmin(user.id, {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name || null,
        weight: formData.weight ? Number(formData.weight) : null,
        height: formData.height ? Number(formData.height) : null,
        goal: formData.goal || null,
      })

      if (userError) throw userError

      // Обновляем роль, если она изменилась
      if (formData.role !== user.role) {
        const { error: roleError } = await updateUserRole(user.id, formData.role)
        if (roleError) throw roleError
      }

      // Обновляем статус блокировки, если он изменился
      const { error: statusError } = await updateUserStatus(user.id, formData.is_blocked)
      if (statusError) throw statusError

      // Обновляем пользователя в родительском компоненте
      onUpdate({
        ...user,
        ...userData,
        role: formData.role,
      })

      onClose()
    } catch (err: any) {
      console.error("Ошибка при обновлении пользователя:", err)
      setError("Не удалось обновить данные пользователя")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Редактировать пользователя</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={16} className="inline mr-1" />
              Имя пользователя
            </label>
            <Input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail size={16} className="inline mr-1" />
              Email
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Shield size={16} className="inline mr-1" />
              Роль
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            >
              <option value="user">Пользователь</option>
              <option value="moderator">Модератор</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_blocked"
              checked={formData.is_blocked}
              onChange={(e) => setFormData({ ...formData, is_blocked: e.target.checked })}
              className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
            />
            <label htmlFor="is_blocked" className="ml-2 text-sm text-gray-700 flex items-center">
              <Lock size={16} className="mr-1 text-red-500" />
              Заблокировать пользователя
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
