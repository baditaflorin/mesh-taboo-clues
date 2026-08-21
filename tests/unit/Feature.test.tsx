import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { CARDS, Feature, cardForRound } from "../../src/Feature";
import { config } from "../../src/config";
describe("Taboo clues", () => {
  it("rotates cards deterministically", () => {
    expect(cardForRound(0)).toBe(CARDS[0]);
    expect(cardForRound(CARDS.length)).toBe(CARDS[0]);
  });
  it("renders shared game", () => {
    render(<Feature room={createMockRoom()} config={config} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Say the clue");
  });
  it("shows joining state", () => {
    render(<Feature room={null} config={config} />);
    expect(screen.getByText(/Joining room/)).toBeInTheDocument();
  });
});
