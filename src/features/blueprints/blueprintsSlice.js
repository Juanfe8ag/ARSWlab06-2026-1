import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../services/apiClient.js'

export const fetchAuthors = createAsyncThunk('blueprints/fetchAuthors', async () => {
  const { data } = await api.get('/blueprints')
  // Expecting API returns array of {author, name, points}
  const authors = [...new Set(data.data.map((bp) => bp.author))]
  return authors
})

export const fetchByAuthor = createAsyncThunk('blueprints/fetchByAuthor', async (author) => {
  const { data } = await api.get(`/blueprints/${encodeURIComponent(author)}`)
  return { author, items: data.data }
})

export const fetchBlueprint = createAsyncThunk(
  'blueprints/fetchBlueprint',
  async ({ author, name }) => {
    const { data } = await api.get(
      `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
    )
    return data.data
  },
)

export const createBlueprint = createAsyncThunk('blueprints/createBlueprint', async (payload) => {
  await api.post('/blueprints', payload)
  return payload
})

export const updateBlueprint = createAsyncThunk("blueprints/updateBlueprint", async ({ author, name, point }) => {
    const { data } = await api.put(
      `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}/points`,
      point
    )
    return { author, name, point }
  }
)

export const deleteBlueprint = createAsyncThunk("blueprints/deleteBlueprint", async ({ author, name }) => {
    await api.delete(
      `/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`
    )
    return { author, name }
  }
)

const slice = createSlice({
  name: 'blueprints',
  initialState: {
    authors: [],
    byAuthor: {},
    current: null,
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      // FETCH AUTHORS
      .addCase(fetchAuthors.pending, (s) => {
        s.status = 'loading'
        s.error = null
      })
      .addCase(fetchAuthors.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.authors = a.payload
      })
      .addCase(fetchAuthors.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.error.message
      })

      // FETCH BY AUTHOR
      .addCase(fetchByAuthor.pending, (s) => {
        s.status = 'loading'
        s.error = null
      })
      .addCase(fetchByAuthor.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.byAuthor[a.payload.author] = a.payload.items
      })
      .addCase(fetchByAuthor.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.error.message
      })

      // FETCH BLUEPRINT
      .addCase(fetchBlueprint.pending, (s) => {
        s.status = 'loading'
        s.error = null
      })
      .addCase(fetchBlueprint.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.current = a.payload
      })
      .addCase(fetchBlueprint.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.error.message
      })

      // CREATE BLUEPRINT
      .addCase(createBlueprint.pending, (s) => {
        s.status = 'loading'
        s.error = null
      })
      .addCase(createBlueprint.fulfilled, (s, a) => {
        s.status = 'succeeded'
        const bp = a.payload
        if (s.byAuthor[bp.author]) s.byAuthor[bp.author].push(bp)
      })
      .addCase(createBlueprint.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.error.message
      })
      //UPDATE Blueprint
      .addCase(updateBlueprint.fulfilled, (s, a) => {
        const { author, name, point } = a.payload
        if (s.current && s.current.author === author && s.current.name === name) {
          s.current.points.push(point)
        }
        const list = s.byAuthor[author]
        if (list) {
          const bp = list.find((b) => b.name === name)
          if (bp) {
            bp.points.push(point)
          }
        }
      })
      //DELETE Blueprint
      .addCase(deleteBlueprint.fulfilled, (s, a) => {
        const { author, name } = a.payload
        const list = s.byAuthor[author]

        if (list) {
          s.byAuthor[author] = list.filter((bp) => bp.name !== name)
        }
        if (s.current?.name === name) {
          s.current = null
        }
      })
  },
})

export default slice.reducer
