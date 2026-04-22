"use client"

import { motion as motionBase, AnimatePresence as AnimatePresenceBase } from 'framer-motion'

// Cast to any to avoid strict JSX prop typing issues across the codebase.
// Individual files can still import framer-motion directly if they want full typing.
const motion: any = motionBase as any
const AnimatePresence: any = AnimatePresenceBase as any

export { motion, AnimatePresence }
