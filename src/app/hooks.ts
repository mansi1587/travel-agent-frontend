import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '@/app/store'

/** Typed wrappers, so components never annotate the store's shape by hand. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
