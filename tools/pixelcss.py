# tạo chande-bootcamp/pixel.css: khung pixel 9 mảnh (border-image SVG), con trỏ pixel
import base64
FR=['..OOOOO..','.OHHHHHO.','OHHBBBBSO','OHBBBBBSO','OHBBBBBSO','OHBBBBBSO','OHBBBBBSO','.OSSSSSO.','..OOOOO..']
INSET=['..OOOOO..','.OSSSSSO.','OSSBBBBHO','OSBBBBBHO','OSBBBBBHO','OSBBBBBHO','OSBBBBBHO','.OHHHHHO.','..OOOOO..']
def svg(rows,pal,w=None,h=None,scale=1):
    H=len(rows); W=len(rows[0]); out=[]
    for y,r in enumerate(rows):
        x=0
        while x<W:
            c=r[x]
            if c=='.': x+=1; continue
            x2=x
            while x2<W and r[x2]==c: x2+=1
            col=pal[c]; op=''
            if isinstance(col,tuple): col,o=col; op=f' fill-opacity="{o}"'
            out.append(f'<rect x="{x}" y="{y}" width="{x2-x}" height="1" fill="{col}"{op}/>'); x=x2
    s=f'<svg xmlns="http://www.w3.org/2000/svg" width="{W*scale}" height="{H*scale}" viewBox="0 0 {W} {H}" shape-rendering="crispEdges">{"".join(out)}</svg>'
    return 'url("data:image/svg+xml;base64,'+base64.b64encode(s.encode()).decode()+'")'
O='#0c0a10'
P={ # khung: viền ngoài O, sáng H (trên trái), nền B, tối S (dưới phải)
 'panel':{'O':O,'H':'#5e5070','B':('#1e1826',.93),'S':'#120e16'},
 'panel2':{'O':O,'H':'#56486a','B':('#2a2234',.97),'S':'#17121d'},
 'card':{'O':O,'H':'#4c4260','B':'#2b2537','S':'#1b1724'},
 'cardHi':{'O':'#8a7aa0','H':'#6a5c80','B':'#332b40','S':'#1b1724'},
 'cardOn':{'O':'#ffd84a','H':'#7a6a40','B':'#352c2a','S':'#1b1724'},
 'btn':{'O':O,'H':'#7a6c92','B':'#40365a','S':'#241e32'},
 'btnHi':{'O':O,'H':'#a090c0','B':'#54487a','S':'#2c2440'},
 'pri':{'O':O,'H':'#f2785e','B':'#b8302a','S':'#741a16'},
 'priHi':{'O':O,'H':'#ffa080','B':'#d24432','S':'#8a2018'},
 'go':{'O':O,'H':'#86d880','B':'#2f8a3e','S':'#1a4e24'},
 'goHi':{'O':O,'H':'#a8f0a0','B':'#3aa24a','S':'#20602c'},
 'gold':{'O':O,'H':'#fff2a8','B':'#ffd84a','S':'#b8861a'},
 'inset':{'O':O,'H':'#4e4460','B':'#141018','S':'#08060a'},
 'insetOn':{'O':'#ffd84a','H':'#6a5c40','B':'#18131c','S':'#08060a'},
 'key':{'O':'#1c1516','H':'#ffffff','B':'#efe6d2','S':'#b0a28c'},
 'red':{'O':'#2a0a0e','H':'#c05050','B':('#3a1820',.96),'S':'#1e0a0e'},
 'green':{'O':'#0a200e','H':'#5ab060','B':('#1a3020',.96),'S':'#0c1a10'},
 'sky':{'O':'#0a1a28','H':'#5aa8d0','B':('#182a38',.96),'S':'#0c1620'},
 'skyBtn':{'O':O,'H':'#8ad0f8','B':'#2a6ab0','S':'#163a66'},
 'purple':{'O':'#1a0e28','H':'#9a6ad0','B':('#2a1e3c',.96),'S':'#140c20'},
}
RAW={k:svg(INSET if k.startswith('inset') else FR,v) for k,v in P.items()}
F={k:f'var(--fr-{k})' for k in P}
VARS=''.join(f'--fr-{k}:{u};' for k,u in RAW.items())
fr=lambda k,w=6:f'border:{w}px solid transparent;border-image:{F[k]} 3 fill/{w}px stretch;'
arrow=['X...........','XX..........','XWX.........','XWWX........','XWWWX.......','XWWWWX......','XWWWWWX.....','XWWWWWWX....','XWWWWXXXX...','XWXWWX......','XX.XWWX.....','....XX......']
hand=['....XX......','...XWWX.....','...XWWX.....','...XWWXXX...','...XWWWWWXX.','.XXXWWWWWWWX','XWWXWWWWWWWX','XWWWWWWWWWWX','.XWWWWWWWWWX','..XWWWWWWWX.','...XWWWWWWX.','....XXXXXX..']
CP={'X':'#1c1516','W':'#fff3d6'}
cur_arrow=svg(arrow,CP,scale=2); cur_hand=svg(hand,CP,scale=2)
css=f"""/* Chan City · bộ giao diện pixel: khung 9 mảnh góc bậc thang (sáng trên trái, tối dưới phải), nút bấm lún,
   thẻ bento, tab, ô nhập lõm, toast theo loại, phím, thanh chỉ số chia đốt, thanh cuộn, con trỏ pixel. File này tạo từ script, sửa màu ở script. */
:root{{{VARS}--cur-arrow:{cur_arrow} 0 0,auto;--cur-hand:{cur_hand} 8 0,pointer}}
html,body,#game{{cursor:var(--cur-arrow)}} button,.btn,.tab,a,[data-a],.qgo,#minimap,.frow,.sw,.ocard{{cursor:var(--cur-hand)!important}}
.panel{{{fr('panel')}background:none;box-shadow:none;border-radius:0}}
.btn{{{fr('btn')}background:none;background-clip:padding-box;box-shadow:none;border-radius:0;padding:2px 18px;color:#fff3d6;text-shadow:2px 2px 0 rgba(0,0,0,.55);filter:drop-shadow(0 3px 0 #0a080e);transition:transform .05s}}
.btn:hover,.btn:focus-visible{{border-image-source:{F['btnHi']};color:#fff;outline:none}} .btn:active{{transform:translateY(3px);filter:none}}
.btn.pri{{border-image-source:{F['pri']}}} .btn.pri:hover,.btn.pri:focus-visible{{border-image-source:{F['priHi']}}}
.btn.go{{border-image-source:{F['go']}}} .btn.go:hover,.btn.go:focus-visible{{border-image-source:{F['goHi']}}}
.btn.sm{{border-width:4px;border-image-width:4px;padding:0 8px;filter:drop-shadow(0 2px 0 #0a080e)}} .btn:disabled{{opacity:.5;filter:none;transform:none}}
.fsg .btn{{box-shadow:none;border-width:6px}} .fsg .btn:active{{box-shadow:none}} .mcard .btn{{background:none;border-image-source:{F['pri']}}}
.tab{{{fr('btn',4)}background:none;border-radius:0;padding:0 8px;filter:drop-shadow(0 2px 0 #0a080e)}} .tab:hover{{border-image-source:{F['btnHi']}}}
.tab.on{{border-image-source:{F['gold']};color:#1c1516;text-shadow:none}}
.panel .list:not(.rows)>.row{{{fr('card')}background:none;border-radius:0;padding:6px 8px}} .panel .list:not(.rows)>.row:hover{{border-image-source:{F['cardHi']};border-color:transparent}}
.panel .list:not(.rows)>.row.on{{border-image-source:{F['cardOn']};box-shadow:none}}
.row{{border-radius:0}} .list.rows>.row{{background:rgba(255,255,255,.04);border:0;box-shadow:inset 0 -2px 0 rgba(0,0,0,.35)}} .list.rows>.row.on{{box-shadow:inset 4px 0 0 #ffd84a,inset 0 -2px 0 rgba(0,0,0,.35)}}
#login input,#cName,.form input,.form select,#chatIn,#msIn,#ochIn,input[type=text],input[type=number],input[type=password],textarea{{{fr('inset')}background:none;border-radius:0;color:#fff3d6}}
#login input:focus,#cName:focus,.form input:focus,#chatIn:focus,#msIn:focus,input:focus,textarea:focus{{border-image-source:{F['insetOn']};outline:none}}
kbd{{{fr('key',3)}background:none;border-radius:0;padding:0 3px;color:#1c1516;font-size:16px;line-height:1}}
.toast{{{fr('panel2')}background:none;box-shadow:none}} .toast.lock{{border-image-source:{F['red']}}} .toast.exp{{border-image-source:{F['green']}}}
.toast.quest{{border-image-source:{F['sky']}}} .toast.skill{{border-image-source:{F['purple']}}} .toast.vnd,.toast.item{{border-image-source:{F['cardOn']}}}
#panelHead{{border-bottom:0;padding:6px 12px 10px;background:linear-gradient(#0c0a10,#0c0a10) left bottom/100% 2px no-repeat,repeating-linear-gradient(90deg,#5e5070 0 4px,transparent 4px 8px) left calc(100% - 4px)/100% 2px no-repeat}}
#panelTitle{{text-shadow:2px 2px 0 #0c0a10;letter-spacing:.5px}}
#panelClose{{{fr('btn',4)}background:none;padding:0 8px;font-size:18px;filter:drop-shadow(0 2px 0 #0a080e)}} #panelClose:hover{{border-image-source:{F['priHi']}}}
#panelInner h5{{display:flex;align-items:center;gap:8px}} #panelInner h5::before{{content:'';flex:none;width:8px;height:8px;background:#ffd84a;box-shadow:0 0 0 2px #0c0a10,inset -2px -2px 0 #b8861a}}
#panelInner h5::after{{content:'';flex:1;height:2px;background:repeating-linear-gradient(90deg,rgba(255,216,74,.35) 0 4px,transparent 4px 8px)}}
.bar{{position:relative;height:10px;background:#18121c;border:2px solid #0c0a10;box-shadow:inset 0 2px 0 rgba(0,0,0,.45)}}
.bar::after{{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(255,255,255,.3) 0 2px,transparent 2px),repeating-linear-gradient(90deg,transparent 0 5px,rgba(0,0,0,.28) 5px 6px)}}
::-webkit-scrollbar{{width:12px;height:12px}} ::-webkit-scrollbar-track{{background:#16121a;box-shadow:inset 2px 0 0 #0c0a10}} ::-webkit-scrollbar-corner{{background:#16121a}}
::-webkit-scrollbar-thumb{{background:#5e5070;border:2px solid #16121a;box-shadow:inset 2px 2px 0 #7e6e94,inset -2px -2px 0 #3a3048}} ::-webkit-scrollbar-thumb:hover{{background:#7a6a90}}
#minimap canvas,#mapCv,#cPreview,#travelCv{{border:2px solid #0c0a10;box-shadow:0 0 0 2px #5e5070}}
.chips span{{border-radius:0;{fr('card',4)}background:none}}
#prompt kbd{{margin-right:4px}}
.slot{{{fr('inset',4)}background:none;border-radius:0}} .slot.on,.slot.sel{{border-image-source:{F['insetOn']}}}
.meal{{{fr('card',3)}background:none;padding:0 4px}} .meal.now{{border-image-source:{F['cardOn']};color:#ffd84a}} .meal.eaten{{border-image-source:{F['go']};background:none;color:#fff3d6}} .meal.missed{{border-image-source:{F['red']};background:none;color:#fff3d6}}
.qgo{{{fr('btn',3)}border-image-source:{F['skyBtn']};background:none;padding:0 5px;color:#fff}} .qgo:hover{{background:none;border-image-source:{F['btnHi']}}}
.sk{{{fr('card',4)}background:none}} .sk.learned{{opacity:.75}}
#title .titleBox{{{fr('panel')}border-radius:0;box-shadow:none;background:none}} #creator{{{fr('panel')}background:none}} .ocard{{{fr('card')}background:none}} .ocard.on{{border-image-source:{F['cardOn']}}}
#bossBar>div:not(.vs){{{fr('panel')}background:none;box-shadow:none}} .cpl,.mrole{{border-radius:0}}
"""
open(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','chande-bootcamp','pixel.css'),'w').write(css)
print(len(css))
