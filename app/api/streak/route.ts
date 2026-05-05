import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { writeClient } from '@/sanity/lib/client'

function emailToDocId(email: string) {
  return `streak-${email.replace(/[^a-zA-Z0-9]/g, '-')}`
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayISO() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.email) {
      return NextResponse.json({ streak: 0, longestStreak: 0, totalPracticeDays: 0, loggedIn: false })
    }
    const docId = emailToDocId(token.email as string)
    const doc = await writeClient.getDocument(docId)
    if (!doc) {
      return NextResponse.json({ streak: 0, longestStreak: 0, totalPracticeDays: 0, loggedIn: true })
    }
    return NextResponse.json({
      streak: doc.currentStreak ?? 0,
      longestStreak: doc.longestStreak ?? 0,
      totalPracticeDays: doc.totalPracticeDays ?? 0,
      lastPracticeDate: doc.lastPracticeDate ?? null,
      loggedIn: true,
    })
  } catch (err) {
    console.error('[streak GET]', err)
    return NextResponse.json({ streak: 0, longestStreak: 0, totalPracticeDays: 0, loggedIn: false })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.email) {
      return NextResponse.json({ streak: 0, loggedIn: false })
    }

    const email = token.email as string
    const docId = emailToDocId(email)
    const today = todayISO()
    const yesterday = yesterdayISO()

    const doc = await writeClient.getDocument(docId)

    if (!doc) {
      // Primera visita
      await writeClient.createOrReplace({
        _id: docId,
        _type: 'userStreak',
        email,
        currentStreak: 1,
        longestStreak: 1,
        lastPracticeDate: today,
        totalPracticeDays: 1,
      })
      return NextResponse.json({ streak: 1, longestStreak: 1, totalPracticeDays: 1, loggedIn: true, isNew: true })
    }

    const last = doc.lastPracticeDate

    if (last === today) {
      // Ya se registró hoy → sin cambios
      return NextResponse.json({
        streak: doc.currentStreak ?? 1,
        longestStreak: doc.longestStreak ?? 1,
        totalPracticeDays: doc.totalPracticeDays ?? 1,
        loggedIn: true,
      })
    }

    let newStreak: number
    if (last === yesterday) {
      // Racha continúa
      newStreak = (doc.currentStreak ?? 0) + 1
    } else {
      // Racha rota
      newStreak = 1
    }
    const newLongest = Math.max(newStreak, doc.longestStreak ?? 0)
    const newTotal = (doc.totalPracticeDays ?? 0) + 1

    await writeClient
      .patch(docId)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastPracticeDate: today,
        totalPracticeDays: newTotal,
      })
      .commit()

    return NextResponse.json({
      streak: newStreak,
      longestStreak: newLongest,
      totalPracticeDays: newTotal,
      loggedIn: true,
      streakIncreased: newStreak > (doc.currentStreak ?? 0),
    })
  } catch (err) {
    console.error('[streak POST]', err)
    return NextResponse.json({ streak: 0, loggedIn: false })
  }
}
