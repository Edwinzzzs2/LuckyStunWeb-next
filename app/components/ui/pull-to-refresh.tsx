"use client"

import * as React from 'react'
import { ArrowDown, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface PullToRefreshProps extends React.HTMLAttributes<HTMLDivElement> {
  onRefresh?: () => Promise<void>
  refreshing?: boolean
  pullThreshold?: number
  maxPullDistance?: number
  disabled?: boolean
}

export const PullToRefresh = React.forwardRef<HTMLDivElement, PullToRefreshProps>(
  (
    {
      children,
      onRefresh,
      refreshing: externalRefreshing,
      pullThreshold = 80,
      maxPullDistance = 120,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const [pullDistance, setPullDistance] = React.useState(0)
    const [isRefreshing, setIsRefreshing] = React.useState(false)
    const [isDragging, setIsDragging] = React.useState(false)

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const startYRef = React.useRef(0)
    const draggingRef = React.useRef(false)
    const pullDistanceRef = React.useRef(0)
    const onRefreshRef = React.useRef<PullToRefreshProps['onRefresh']>(onRefresh)
    const refreshingRef = React.useRef(false)

    const setDistance = React.useCallback((value: number) => {
      pullDistanceRef.current = value
      setPullDistance(value)
    }, [])

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node
        if (!ref) return
        if (typeof ref === 'function') ref(node)
        else (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      },
      [ref]
    )

    React.useEffect(() => {
      onRefreshRef.current = onRefresh
    }, [onRefresh])

    const refreshing = Boolean(externalRefreshing || isRefreshing)

    React.useEffect(() => {
      refreshingRef.current = refreshing
    }, [refreshing])

    React.useEffect(() => {
      if (!disabled) return
      draggingRef.current = false
      refreshingRef.current = false
      setIsRefreshing(false)
      setIsDragging(false)
      setDistance(0)
    }, [disabled, setDistance])

    React.useEffect(() => {
      const container = containerRef.current
      if (!container) return
      if (disabled) return

      const handleTouchStart = (e: TouchEvent) => {
        if (refreshingRef.current) return
        if (container.scrollTop !== 0) {
          draggingRef.current = false
          setIsDragging(false)
          return
        }
        startYRef.current = e.touches[0]?.clientY ?? 0
        draggingRef.current = true
        setIsDragging(true)
      }

      const handleTouchMove = (e: TouchEvent) => {
        if (!draggingRef.current) return
        if (container.scrollTop > 0) return

        const currentY = e.touches[0]?.clientY ?? 0
        const diff = currentY - startYRef.current

        if (diff <= 0) {
          draggingRef.current = false
          setIsDragging(false)
          setDistance(0)
          return
        }

        if (e.cancelable) e.preventDefault()
        const nextDistance = Math.min(diff * 0.5, maxPullDistance)
        setDistance(nextDistance)
      }

      const handleTouchEnd = async () => {
        if (!draggingRef.current) return
        draggingRef.current = false
        setIsDragging(false)

        const currentDistance = pullDistanceRef.current
        const fn = onRefreshRef.current

        if (currentDistance >= pullThreshold && fn && !refreshingRef.current) {
          refreshingRef.current = true
          setIsRefreshing(true)
          setDistance(pullThreshold)
          try {
            await fn()
          } finally {
            window.setTimeout(() => {
              refreshingRef.current = false
              setIsRefreshing(false)
              setDistance(0)
            }, 500)
          }
          return
        }

        setDistance(0)
      }

      container.addEventListener('touchstart', handleTouchStart, { passive: true })
      container.addEventListener('touchmove', handleTouchMove, { passive: false })
      container.addEventListener('touchend', handleTouchEnd)

      return () => {
        container.removeEventListener('touchstart', handleTouchStart)
        container.removeEventListener('touchmove', handleTouchMove)
        container.removeEventListener('touchend', handleTouchEnd)
      }
    }, [disabled, maxPullDistance, pullThreshold, setDistance])

    const showIndicator = !disabled && (refreshing || pullDistance > 0)

    return (
      <div ref={setRefs} className={cn('relative overflow-y-auto overscroll-y-contain', className)} {...props}>
        {showIndicator ? (
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 flex w-full items-center justify-center"
            style={{
              height: pullThreshold,
              transform: `translateY(${pullDistance - pullThreshold}px)`,
              opacity: Math.min(pullDistance / pullThreshold, 1),
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)',
            }}
          >
            {refreshing ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <ArrowDown
                className={cn(
                  'h-6 w-6 text-primary transition-transform duration-200',
                  pullDistance > pullThreshold * 0.8 ? 'rotate-180' : ''
                )}
              />
            )}
          </div>
        ) : null}

        <div
          style={{
            transform: `translateY(${disabled ? 0 : pullDistance}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.215, 0.61, 0.355, 1)',
          }}
        >
          {children}
        </div>
      </div>
    )
  }
)
