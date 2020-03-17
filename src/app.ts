/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { resolve } from 'path';

// https://17853.live.streamtheworld.com/KUOWFM_HIGH_MP3.mp3?dist=kuow

/** Global state, persists after session ends. */
let playing = false;

/**
 * A simple music player for Street Hoops World in Altspace.
 * Users can play/pause a looping track.
 * Author: Adrian Balanon Audio By: Megan Frazier
 */
export default class NprRadio {
	private kuow: MRE.VideoStream;
	private radioBody: MRE.Actor;
	private wooferAnim: MRE.Animation;
	private playObj: MRE.Actor;
	private vidSettings: MRE.SetVideoStateOptions = { visible: false, paused: false, volume: 0.8, spread: 0 };

	constructor(private context: MRE.Context, private baseUrl: string) {
		// create asset container for audio
		this.context.onStarted(() => this.started());
	}

	// Once the context is "started", initialize the app.
	private async started() {
		const assets = new MRE.AssetContainer(this.context);
		this.kuow = assets.createVideoStream("KUOW", {
			uri: 'https://17853.live.streamtheworld.com/KUOWFM_HIGH_MP3.mp3?dist=kuow'
		});

		this.radioBody = MRE.Actor.CreateFromGltf(assets, {
			uri: `${this.baseUrl}/boombox.glb`,
			colliderType: 'box',
			actor: {
				name: 'BoomboxBody',
				transform: { local: { rotation: MRE.Quaternion.FromEulerAngles(0, Math.PI, 0) } }
			}
		});

		await this.radioBody.created();
		this.wooferAnim = this.radioBody.animationsByName.get("boombox_woofer_Action");
		this.wooferAnim.wrapMode = MRE.AnimationWrapMode.Loop;

		this.radioBody.setBehavior(MRE.ButtonBehavior)
			.onHover('enter', user => {
				if (!/moderator/u.test(user.properties['altspacevr-roles'])) return;
				this.radioBody.animateTo(
					{ transform: { local: { scale: { x: 1.1, y: 1.1, z: 1.1 } } } },
					0.3, MRE.AnimationEaseCurves.EaseOutCubic);
			})
			.onHover('exit', user => {
				if (!/moderator/u.test(user.properties['altspacevr-roles'])) return;
				this.radioBody.animateTo(
					{ transform: { local: { scale: { x: 1, y: 1, z: 1 } } } },
					0.3, MRE.AnimationEaseCurves.EaseOutCubic);
			})
			.onClick(user => {
				if (!/moderator/u.test(user.properties['altspacevr-roles'])) return;
				this.setPlaying(!playing);
			});

		this.setPlaying(playing);
	}

	private setPlaying(on: boolean) {
		if (on) {
			this.playObj = MRE.Actor.Create(this.context, { actor: { name: "PlayObject" }});
			this.playObj.startVideoStream(this.kuow.id, this.vidSettings);
			this.wooferAnim.play();
			playing = true;
		} else {
			this.playObj.destroy();
			this.playObj = null;
			this.wooferAnim.stop();
			playing = false;
		}
	}
}

const server = new MRE.WebHost({
	baseDir: resolve(__dirname, '..', 'public')
});
server.adapter.onConnection(context => new NprRadio(context, server.baseUrl));
