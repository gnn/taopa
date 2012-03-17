(ns main
  (:import  (java.awt Color)
            (javax.swing JFrame JPanel JScrollPane SwingUtilities)))

(defn foldr [f e xs] (if-let [x (first xs)] (f x (foldr f e (rest xs))) e))

(defn docfn [x] (eval `(doc ~x)))

(defn print-docs [ns]
  (map 
    (comp docfn #(symbol (str ((meta %1) :ns)) (str ((meta %1) :name)))) 
    (vals (ns-interns ns))))

; Turmites are functions taking an internal state, an external state
; and a direction and returning a new internal state, a new external
; state and a new direction. The only direction changes allowed are
; rotations by an integer multiple of 90 degrees. States are
; represented as integers.
; The external state in each step is supplied by a tape which consits
; of modifiable cells, each containing a state. In each step a given
; turmite reads the state of the cell it is currently on, computes the
; changes needed, modifies the state of the current cell moves one step
; into the new direction and starts a new step on the new cell.
; As cells are implemented as agents, carrying out one step of a given
; turmite means:
; - reading the value of the current agent
; - computing the new values of internal- and external state as well as
;   direction
; - sending a function to change the agent.
; The function which changes the agent should do the following:
; - add a watch function to this agent
; - return the new external state, thus setting the cells new state.
; The watch function should do the following:
; - start the next step of the given turmite on the cell which is one
;   step ahead in the new direction using the new internal state
; - remove this watch function
; The fact that the watch function is added during an action and thus
; on the agents thread prevents race conditions where the watch
; function is already in place but the agent is changed by a different
; action. The watch function has to be removed so that no turmite step
; is executed more than once.

(defn turn
  "Does n 90 degree left turns in the plane spanned by the first two
  components of c.

  n defaults to 1 if not given."
  ([c] (let [v (vec c) x (v 0) y (v 1)] (concat [(- y) x] (drop 2 v))))
  ([n c] (nth (iterate turn c) (rem n 4))))
 
(defn langtons-ant 
  "Langtons ant doesn't use state; 0 means white; 1 means black;"
  ([direction state cell] [
    (cond (= cell 0) (turn 3 direction) (= cell 1) (turn 1 direction))
    state 
    (rem (+ 1 cell) 2)])
  ([_ _ direction-override state-override]
    (partial langtons-ant direction-override state-override)))

(let [moves [[[1, 1, 0], [0, 0, 1]],
             [[1, 3, 0], [1, 3, 0]]]]
  (defn spiral
    ([d s c] (let [m ((moves s) c)] [(turn (m 1) d), (m 2), (m 0)]))
    ([_ _ n-d n-s] (partial spiral n-d n-s))))

(let [moves [[[1, 3, 0], [3, 3, 0], [0, 1, 0], [2, 1, 0]]]]
  (defn mystery
    ([d s c] (let [m ((moves s) c)] [(turn (m 1) d), (m 2), (m 0)]))
    ([_ _ n-d n-s] (partial mystery n-d n-s))))

(defn random-ant
  ([direction state cell] [(turn (rand-int 4) direction) state (rand-int 11)])
  ([_ _ new-dir new-state] (partial random-ant new-dir new-state)))

(defn random-move [nstates, ncolors]
  {:color (rand-int ncolors), :state (rand-int nstates), :turns (rand-int 4)})

(defn generate-ant [nstates, ncolors]
  (let [generate-move (fn [_] {:color (rand-int ncolors)
                               :state (rand-int nstates)
                               :turns (rand-int 4)})
        generate-moves (fn [cs] (map generate-move cs))
        moves (map generate-moves (repeat ncolors (range nstates)))]
    (fn self ([direction state cell]
              (let [move (nth (nth moves cell) state)]
                [(turn (move :turns) direction) (move :state) (move :color)]))
             ([_ _ n-d n-s] (partial self n-d n-s)))))

(defn generate-memoized-ant [nstates, ncolors]
  (let [move (memoize (fn [s, c] (loop [m (random-move nstates ncolors)]
                                   (if (and (= (m :color) 0) (= (m :state) 0)
                                            (= s 0)          (= c 0))
                                     (recur (random-move nstates ncolors))
                                     m))
                        #_(random-move nstates ncolors)))]
    (fn self ([d s c] (let [m (move s c)] [(turn (m :turns) d),
                                           (m :state),
                                           (m :color)]))
             ([_ _ n-d n-s] (partial self n-d n-s)))))

(defn create-world
  "Constructs a tape/world which holds the cells which contain the
  external state used as input to a turmite.
  A tape/world is essentially a function which accepts two types of
  arguments:
   
   - a sequence of numbers; these are treated as coordinates and the
     return value will be the cell (an agent) at those coordinates
   - a keyword; see below for valid keywords and their meanings.
   
  If one argument is supplied it is expected to be a map, where
  meaningful map entrys are:
  
   :bounds => [mins, maxs]
    mins and maxs should be sequences of numbers interpreted as
    vectors serving as the minimum and maximum bounds of the world
    inclusive
  
   :default => n
    every cell of the world is set to n; defaults to 0 if omitted
    
   :watches => fs 
    fs should a sequence of watch functions which will be added to
    each cell of the world, partially applied to the coordinate of each
    cell they are added to
  
  TODO: 
    - add watches with deterministic keys?
    - implement unbounded world"
  ([] (create-world {}))
  ([mins maxs] (create-world {:bounds [mins, maxs]}))
  ([option-map] (let [options (merge {:default 0} option-map)]  
    (if-let [[mins, maxs] (options :bounds)]
      (reduce 
        (fn [world coordinate] (assoc world coordinate
          (reduce #(add-watch %1 (gensym) (partial %2 coordinate)) 
            (agent (options :default))
            (options :watches))))
        options
        (reduce
          (fn [cs ns] (for [c cs, n ns] (conj c n)))
          '([])
          (map range mins (map #(+ % 1) maxs))))
      ()))))

(defn watched-send
  "Nearly the same as:
  
  (do (add-watch :foo a w) (send a f args) (remove-watch a :foo))

  except that instead of ':foo' a unique key is used and adding the
  watch function 'w' is done as part of the same action as evaluating
  'f' and removing the watch function is done as part of the watch
  function, before evaluating 'w'.
  This should ensure the following:
   - evaluation of 'w' will only be triggered once
   - evaluation of 'w' will only be triggered by the change done as part
     of: (apply f @a args)"
  [a f w & args] 
  (if-let [e (agent-error a)] (println e))
  (send a (fn [state]
    (add-watch a (gensym) (fn [k r o n]
      (remove-watch r k)
      (w k r o n)))
    (apply f state args))))

(defn normalize
  "Normalizes each entry in 'v' to be >= the corresponding entry in
  'mins' and <= the corresponding entry in 'maxs'. ;)"
  [mins maxs v]
  (map 
    (fn [min max n] (let [d (inc (- max min)), candidate (rem (- n min) d)]
      (+ min (if (neg? candidate) (+ d candidate) candidate))))
    mins maxs v))

(defn neighbour
  "Returns the coordintes of the cell which is next to the cell with
  coordinates 'c' in direction 'd' on the world/tape 'w'."
  [w c d] (if-let [[mins, maxs] (w :bounds)]
    (normalize mins maxs (map + c d))
    ()))

(defn step
  "Executes a step of the turmite 't' on the cell which has coordinates
  'c' in the world (tape) 'w'. Automatically schedules the next step of
  the turmite on the next cell.
  The turmite 't' is assumed to be already partially applied to its
  direction and state."
  [t w c]
  (let [cell (w c)]
    (watched-send cell
      (comp #(nth % 2) t)
      (fn [k r o n] (let [
        [newdirection newstate _] (t o)]
        ;(Thread/sleep 0 1)
        (step
          (t newdirection newstate)
          w
          (neighbour w c newdirection))))))) 

(let [fixed (map #(.getRGB %)
                 [Color/WHITE, Color/BLACK,Color/GRAY, 
                  Color/RED, Color/GREEN, Color/BLUE,
                  Color/CYAN, Color/MAGENTA, Color/YELLOW,
                  Color/ORANGE, Color/PINK])
      maxrgb (+ 255 (bit-shift-left 255 8) (bit-shift-left 255 16))
      used (set fixed)]
  (defn colors [n]
    (if (>= n (count fixed))
        (println "Trying to access an undefined color. Wrapping around."))
    (nth fixed (rem n (count fixed)))))

(defn langton [w, h] (let [
  ant (generate-memoized-ant 2 2)
  ;ant (generate-ant 2 11)
  ;ant langtons-ant
  ;ant spiral
  ;ant mystery
  half #(quot (dec %) 2)
  pixels (int-array (* w h) (colors 0))
  source (proxy
    [java.awt.image.MemoryImageSource]
    [w, h, pixels, 0, w])
  world (create-world {
    :bounds [[0, 0] [(dec w), (dec h)]], 
    :watches [(fn [c k r o n]
      (aset-int pixels (+ (* w (c 1)) (c 0)) (colors n))
      (. source newPixels (c 0) (c 1) 1 1))]})]
  (. source setAnimated true)
  #_(step (partial ant [1,0] 0) world [(half w), (half h)])
  (dorun (map #(step (partial (generate-memoized-ant 2 3)
                              %1 0) world %2)
    [[1, 0], [0, -1], [-1, 0], [0, 1], [1, 1]]
    [[599, 149], [199, 149], [199, 449], [599, 449], [399, 299]]))
  #_(dorun (map #(step (partial langtons-ant %1 0) world %2)
    [[1, 0], [0, -1], [-1, 0], [0, 1]]
    [[374, 124], [124, 124], [124, 374], [374, 374]]))
  (comment (step
    (partial langtons-ant [0, 1] 0)
    world
    [(quot (dec w) 2) , (quot (dec h) 2)]))
  source))

(defn antpanel [w, h] (let
  [ imageref (atom nil)
    panel (proxy [JPanel] [] 
      (paint [g] (if-not (nil? @imageref) (. g drawImage @imageref 0 0 this))))
    image (. panel createImage (langton w h))
    dimensions (new java.awt.Dimension w h)
    centering (new JPanel(new java.awt.GridBagLayout))
    scrollpane (new JScrollPane)]
  (swap! imageref (constantly image))
  (. centering setPreferredSize dimensions)
  (. centering add panel)
  (dorun (
    (juxt
      #(.setMinimumSize %1 %2) #(.setPreferredSize %1 %2)
      #(.setMaximumSize %1 %2))
    panel dimensions))
  (. scrollpane setViewportView centering)
  scrollpane))

(defn main-window [] (doto 
  (new JFrame "Turmites")
  (.setDefaultCloseOperation JFrame/EXIT_ON_CLOSE)
  (.addWindowListener (proxy [java.awt.event.WindowAdapter] []
    (windowClosing [event] ())))
  (.setLayout (new java.awt.BorderLayout))
  (.add (antpanel 800 600) java.awt.BorderLayout/CENTER)
  (.pack)
  (.setVisible true)))

(javax.swing.SwingUtilities/invokeLater (proxy [Runnable] []
  (run [] (main-window))))

