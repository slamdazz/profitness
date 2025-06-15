"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { X, BookOpen, ImageIcon, Clock, BarChart3 } from "lucide-react"
import type { Course } from "../../types"
import { createCourse, updateCourse } from "../../lib/supabase"

interface CourseModalProps {
  course?: Course
  isOpen: boolean
  onClose: () => void
  onSave: (course: Course) => void
}

export const CourseModal: React.FC<CourseModalProps> = ({ course, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    duration: "",
    is_active: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!course

  useEffect(() => {
    if (isOpen) {
      if (course) {
        setFormData({
          title: course.title,
          description: course.description,
          image_url: course.image_url,
          level: course.level,
          duration: course.duration.toString(),
          is_active: course.is_active ?? true,
        })
      } else {
        setFormData({
          title: "",
          description: "",
          image_url: "",
          level: "beginner",
          duration: "",
          is_active: true,
        })
      }
      setError(null)
    }
  }, [course, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const courseData = {
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        level: formData.level,
        duration: Number(formData.duration),
        is_active: formData.is_active,
      }

      if (isEditing && course) {
        const { data, error } = await updateCourse(course.id, courseData)
        if (error) throw error
        onSave({ ...course, ...data })
      } else {
        const { data, error } = await createCourse(courseData)
        if (error) throw error
        onSave(data)
      }

      onClose()
    } catch (err: any) {
      console.error("Ошибка при сохранении курса:", err)
      setError("Не удалось сохранить курс")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{isEditing ? "Редактировать курс" : "Создать курс"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <BookOpen size={16} className="inline mr-1" />
              Название курса
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Введите название курса"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              placeholder="Описание курса"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <ImageIcon size={16} className="inline mr-1" />
              URL изображения
            </label>
            <Input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              required
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <BarChart3 size={16} className="inline mr-1" />
                Уровень сложности
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="beginner">Начинающий</option>
                <option value="intermediate">Средний</option>
                <option value="advanced">Продвинутый</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock size={16} className="inline mr-1" />
                Продолжительность (дни)
              </label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                min="1"
                placeholder="30"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Опубликовать курс
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Сохранение..." : isEditing ? "Обновить" : "Создать"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
