import { Component } from 'react'

export default class LabBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-slate-900 p-8 text-center">
        <div>
          <h2 className="text-xl text-white">The 3D lab is unavailable on this device</h2>
          <p className="my-4 text-slate-300">Continue experimenting with the 2D laboratory.</p>
          <a className="rounded-lg bg-cyan-400 px-4 py-2 text-slate-900" href="?mode=classic">Open 2D lab</a>
        </div>
      </div>
    )
    return this.props.children
  }
}
