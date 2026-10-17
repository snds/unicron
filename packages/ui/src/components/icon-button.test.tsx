import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { IconButton } from "./icon-button"
import { Toggle } from "./ui/toggle"

describe("IconButton", () => {
  it("names the control from its label", () => {
    render(<IconButton label="Archive" icon="archive" />)
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument()
  })

  it("disabled disables the control itself, not only its tooltip", () => {
    const onClick = vi.fn()
    render(<IconButton label="Archive" icon="archive" disabled onClick={onClick} />)
    const button = screen.getByRole("button", { name: "Archive" })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("disabled reaches a control passed through render", () => {
    render(<IconButton label="Pin" icon="keep" disabled render={<Toggle />} />)
    expect(screen.getByRole("button", { name: "Pin" })).toBeDisabled()
  })

  it("an enabled IconButton still fires", () => {
    const onClick = vi.fn()
    render(<IconButton label="Archive" icon="archive" onClick={onClick} />)
    fireEvent.click(screen.getByRole("button", { name: "Archive" }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
