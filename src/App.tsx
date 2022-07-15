import React, { useState, useEffect, useReducer } from "react";
import "./App.css";

type Set = {
  name: string;
  code: string;
  digital: boolean;
  set_type: string;
  icon_svg_uri: string;
};
type SetsResponse = {
  data: Set[];
};
type CardImages = {
  small: string;
  normal: string;
  large: string;
};
type CardPrices = {
  eur: string;
};
type Card = {
  id: string;
  set: string;
  name: string;
  image_uris: CardImages;
  prices: CardPrices;
};

type State = {
  cards: Card[];
  loading: string[];
};

type Action = {
  type: typeof ACTIONS.FETCH_CARDS | typeof ACTIONS.ADD_CARDS;
  payload?: Card[] | string;
};

const ACTIONS = {
  FETCH_CARDS: "FETCH_CARDS",
  FETCH_URL: "FETCH_URL",
  FINISH_FETCH: "FINISH_FETCH",
  ADD_CARDS: "ADD_CARDS",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ACTIONS.FETCH_CARDS:
      return { loading: [], cards: [] };
    case ACTIONS.FETCH_URL:
      if (action.payload instanceof Array || action.payload === undefined) {
        return state;
      }
      return { ...state, loading: [...state.loading, action.payload] };
    case ACTIONS.FINISH_FETCH:
      if (action.payload instanceof Array || action.payload === undefined) {
        return state;
      }
      return {
        ...state,
        loading: [...state.loading.filter((url) => url !== action.payload)],
      };
    case ACTIONS.ADD_CARDS:
      if (action.payload === undefined || typeof action.payload === "string") {
        return state;
      }
      return {
        ...state,
        cards: [...state.cards, ...action.payload]
          .filter((card) => card.prices.eur != null)
          .sort((a, b) =>
            Number(a.prices.eur) < Number(b.prices.eur) ? 1 : -1
          ),
      };
    default:
      return state;
  }
}
function App() {
  const [sets, setSets] = useState<Set[]>([]);
  const [showSets, setShowSets] = useState(false);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [state, dispatch] = useReducer(reducer, {
    loading: [],
    cards: [],
  });

  useEffect(() => {
    fetch("https://api.scryfall.com/sets")
      .then((res) => res.json())
      .then((data: SetsResponse) => {
        setSets(
          data.data.filter(
            (set) => !["alchemy", "token", "memorabilia"].includes(set.set_type)
          )
        );
      });
  }, []);

  const onSetClick = (set: Set) => {
    if (selectedSets.includes(set.code)) {
      setSelectedSets(selectedSets.filter((s) => s !== set.code));
    } else {
      setSelectedSets([...selectedSets, set.code]);
    }
  };
  const fetchCards = (url: string) => {
    dispatch({ type: ACTIONS.FETCH_URL, payload: url });
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        dispatch({ type: ACTIONS.ADD_CARDS, payload: data.data });
        if (data.has_more) {
          fetchCards(data.next_page);
        }
        dispatch({ type: ACTIONS.FINISH_FETCH, payload: url });
      });
  };

  const getCards = () => {
    dispatch({ type: ACTIONS.FETCH_CARDS });
    setShowSets(false);
    selectedSets.forEach((set) => {
      fetchCards(
        `https://api.scryfall.com/cards/search?q=s:${set} eur>=0.01 unique:prints`
      );
    });
  };

  return (
    <div className="App">
      <div>
        <button onClick={() => setShowSets(!showSets)}>
          {selectedSets.length} Sets selected
        </button>
        <button onClick={() => setSelectedSets([])}>Clear</button>
        <button onClick={() => getCards()}>Get Cards</button>
        {showSets && (
          <ul>
            {sets.map((set, index) => (
              <li key={index}>
                <input
                  type="checkbox"
                  value={set.code}
                  id={set.code}
                  checked={selectedSets.includes(set.code)}
                  onChange={() => onSetClick(set)}
                />
                <label htmlFor={set.code}>
                  <div
                    style={{
                      display: "inline-block",
                      width: "2em",
                      textAlign: "right",
                    }}
                  >
                    <img
                      src={set.icon_svg_uri}
                      alt={set.code}
                      style={{ display: "inline", maxHeight: "1em" }}
                    />
                  </div>
                  {set.name}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      {state.loading.length > 0 && <>Loading</>}
      <div>
        {state.loading.length === 0 &&
          state.cards.map((card) => (
            <img
              key={card.id}
              src={card.image_uris.normal}
              style={{
                width: `calc(100px + ${Number(card.prices.eur) * 4}px)`,
              }}
              alt={`${card.name} - ${card.prices.eur}`}
            />
          ))}
      </div>
    </div>
  );
}

export default App;
