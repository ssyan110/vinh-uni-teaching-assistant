"""Seeded, illustrative game simulations; not a model of classroom students."""
import json, random, statistics, time
from pathlib import Path

def windows(side,k):
    masks=[]
    for r in range(side):
        for c in range(side):
            for dr,dc in [(0,1),(1,0),(1,1),(1,-1)]:
                if 0<=r+(k-1)*dr<side and 0<=c+(k-1)*dc<side:
                    masks.append(sum(1<<((r+i*dr)*side+c+i*dc) for i in range(k)))
    return masks

def simulate(side,k,mode,n,seed):
    rng=random.Random(seed); masks=windows(side,k); by_cell=[[m for m in masks if m&(1<<i)] for i in range(side*side)]
    wins=[0,0];draws=0;moves=[]
    for game in range(n):
        owners=[0,0];empty=list(range(side*side));turn=0
        while empty:
            mine,other=owners[turn],owners[1-turn]
            if mode=='random': choice=rng.choice(empty)
            else:
                scores=[]
                for cell in empty:
                    own_win=other_win=False; score=0
                    for mask in by_cell[cell]:
                        own=(mine&mask).bit_count();opp=(other&mask).bit_count()
                        if not opp:
                            own_win |= own==k-1
                            score+=5**own
                        if not own:
                            other_win |= opp==k-1
                            score+=.9*5**opp
                    scores.append((2 if own_win else 1 if other_win else 0,score if mode=='win-block-potential' else 0,rng.random(),cell))
                choice=max(scores)[-1]
            empty.remove(choice);owners[turn]|=1<<choice
            if any(owners[turn]&m==m for m in by_cell[choice]):
                wins[turn]+=1;moves.append(side*side-len(empty));break
            turn=1-turn
        else:draws+=1
    return dict(side=side,line=k,policy=mode,games=n,winning_windows=len(masks),first_wins=wins[0],second_wins=wins[1],draws=draws,win_rate=round(sum(wins)/n,4),median_moves_if_win=statistics.median(moves) if moves else None,seed=seed)

if __name__=='__main__':
    results=[]
    for side,k in [(6,3),(6,4),(6,5),(9,5)]:
        for mode,n in [('random',10000),('win-block-random',5000),('win-block-potential',2000)]:
            row=simulate(side,k,mode,n,20260906+side*10+k)
            results.append(row);print(json.dumps(row),flush=True)
    (Path(__file__).parent/'win-length-analysis.json').write_text(json.dumps(results,indent=2)+'\n')
